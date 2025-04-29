import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import HealthMetrics from '@/models/HealthMetrics';
import HealthMetricsHistory from '@/models/HealthMetricsHistory';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const healthData = await req.json();
    
    await dbConnect();
    
    // Check if this is the first submission or an update
    const existingMetrics = await HealthMetrics.findOne({ userId: session.user.id });
    const isInitialSubmission = !existingMetrics;
    
    // No need to convert goalDeadlines anymore - it's now a plain object in the schema
    // Just ensure it's defined
    const formattedHealthData = {
      ...healthData,
      goalDeadlines: healthData.goalDeadlines || {}
    };
    
    // Save this submission to health metrics history
    const historyEntry = await HealthMetricsHistory.create({
      userId: session.user.id,
      height: healthData.height,
      weight: healthData.weight,
      bloodPressure: healthData.bloodPressure,
      heartRate: healthData.heartRate,
      respiratoryRate: healthData.respiratoryRate,
      temperature: healthData.temperature,
      sleepDuration: healthData.sleepDuration,
      stressLevel: healthData.stressLevel,
      activityLevel: healthData.activityLevel,
      recordedAt: new Date(),
      notes: `Health data from ${isInitialSubmission ? 'initial submission' : 'health form update'}`
    });
    
    let healthMetrics;
    
    if (isInitialSubmission) {
      // Create new health metrics record for first-time submission
      healthMetrics = await HealthMetrics.create({
        userId: session.user.id,
        ...formattedHealthData,
        recordedAt: new Date(),
        history: [historyEntry._id]
      });
    } else {
      // Update existing health metrics record
      healthMetrics = await HealthMetrics.findOneAndUpdate(
        { userId: session.user.id },
        {
          ...formattedHealthData,
          recordedAt: new Date(),
          $push: { history: historyEntry._id }
        },
        { new: true }
      );
    }
    
    // Update user profile
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      { 
        initialHealthDataSubmitted: true,
        lastMetricsUpdate: new Date(),
        $inc: { metricsUpdateCount: 1 }
      },
      { new: true }
    );
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      healthMetrics,
      historyEntry,
      initialHealthDataSubmitted: true,
      historyRecordCount: userProfile.metricsUpdateCount
    });
  } catch (error) {
    console.error('Error saving health data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}