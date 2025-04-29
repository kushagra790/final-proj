import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HealthReport from '@/models/HealthReport';
import User from '@/models/User';
import HealthMetrics from '@/models/HealthMetrics';
import FoodEntry from '@/models/FoodEntry';
import Exercise from '@/models/Exercise';
import Sleep from '@/models/Sleep';
import mongoose from 'mongoose';
import { 
  generateNutritionAdviceWithAI, 
  generateHealthPredictionsWithAI, 
  generateHealthRecommendationsWithAI 
} from '@/lib/ai-report-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }
    
    // Get user ID from session (could be in id or sub property)
    const userId = session.user.id || (session.user as any).sub;
    
    if (!userId) {
      console.error('No user ID found in session:', session);
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }
    
    // Find the report
    const report = await HealthReport.findOne({
      _id: params.id,
      userId: userId
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch user health metrics for AI generation
    const userInfo = await User.findById(userId).lean();
    const healthMetrics = await HealthMetrics.findOne({ userId }).sort({ recordedAt: -1 }).lean();
    
    // Fetch recent activity data
    const recentFoodEntries = await FoodEntry.find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    
    const recentExercises = await Exercise.find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    
    const recentSleep = await Sleep.find({ userId })
      .sort({ date: -1 })
      .limit(14)
      .lean();

    // Prepare context for AI
    const healthContext = {
      user: userInfo,
      healthMetrics,
      recentFoodEntries,
      recentExercises,
      recentSleep,
      report: report.toObject()
    };

    // Generate AI-enhanced report data
    const enhancedReport = { ...report.toObject() };
    
    // Generate personalized nutrition targets based on user profile
    if (!enhancedReport.targets || Object.keys(enhancedReport.targets).length === 0) {
      const nutritionAdvice = await generateNutritionAdviceWithAI(healthContext, enhancedReport.healthScore || 70);
      enhancedReport.targets = {
        calories: nutritionAdvice.calorieTarget || 0,
        protein: nutritionAdvice.proteinTarget || 0,
        carbs: nutritionAdvice.carbsTarget || 0,
        fats: nutritionAdvice.fatsTarget || 0
      };
    }
    
    // Generate personalized activity targets
    if (!enhancedReport.activityTargets || Object.keys(enhancedReport.activityTargets).length === 0) {
      const activityLevel = Array.isArray(healthMetrics) 
        ? 'moderate' 
        : healthMetrics?.activityLevel || 'moderate';
      
      // Determine appropriate targets based on activity level and health
      let stepsTarget = 10000; // Default
      let activeMinutesTarget = 60; // Default
      let caloriesBurnedTarget = 500; // Default
      
      switch(activityLevel) {
        case 'sedentary':
          stepsTarget = 7000;
          activeMinutesTarget = 30;
          caloriesBurnedTarget = 300;
          break;
        case 'light':
          stepsTarget = 8000;
          activeMinutesTarget = 45;
          caloriesBurnedTarget = 400;
          break;
        case 'moderate':
          stepsTarget = 10000;
          activeMinutesTarget = 60;
          caloriesBurnedTarget = 500;
          break;
        case 'active':
          stepsTarget = 12000;
          activeMinutesTarget = 75;
          caloriesBurnedTarget = 700;
          break;
        case 'very-active':
          stepsTarget = 15000;
          activeMinutesTarget = 90;
          caloriesBurnedTarget = 900;
          break;
      }
      
      // Adjust based on any health conditions
      if (!Array.isArray(healthMetrics) && healthMetrics?.chronicConditions) {
        // Reduce targets if the user has certain chronic conditions
        if (!Array.isArray(healthMetrics) && healthMetrics?.chronicConditions?.includes('heart disease') || 
            healthMetrics?.chronicConditions?.includes('hypertension')) {
          stepsTarget = Math.round(stepsTarget * 0.8);
          activeMinutesTarget = Math.round(activeMinutesTarget * 0.8);
          caloriesBurnedTarget = Math.round(caloriesBurnedTarget * 0.8);
        }
      }
      
      enhancedReport.activityTargets = {
        steps: stepsTarget,
        activeMinutes: activeMinutesTarget,
        caloriesBurned: caloriesBurnedTarget
      };
    }
    
    // Generate AI-powered health predictions if not already present
    if (!enhancedReport.predictions || enhancedReport.predictions.length === 0) {
      try {
        const predictionsData = await generateHealthPredictionsWithAI(healthContext, enhancedReport.healthScore || 70);
        if (predictionsData && Array.isArray(predictionsData)) {
          enhancedReport.predictions = predictionsData;
        } else {
          // Fallback structure if AI generation fails
          enhancedReport.predictions = [];
        }
      } catch (error) {
        console.error('Error generating AI health predictions:', error);
        enhancedReport.predictions = [];
      }
    }
    
    // Add or update health recommendations
    try {
      const recommendations = await generateHealthRecommendationsWithAI(healthContext);
      if (recommendations) {
        enhancedReport.recommendations = recommendations;
      }
    } catch (error) {
      console.error('Error generating AI health recommendations:', error);
      // Keep existing recommendations if present
    }
    
    return NextResponse.json(enhancedReport);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report details' },
      { status: 500 }
    );
  }
}
