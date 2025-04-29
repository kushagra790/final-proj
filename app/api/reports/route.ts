import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthReport from "@/models/HealthReport"; // Changed from Report to HealthReport
import HealthMetrics from "@/models/HealthMetrics";
import HealthMetricsHistory from "@/models/HealthMetricsHistory";
import Sleep from "@/models/Sleep";
import FoodEntry from "@/models/FoodEntry";
import { format, subDays, subMonths, parseISO, formatDistanceToNow } from "date-fns";
import mongoose from 'mongoose';
import { 
  generateVitalSignsWithAI, 
  generateNutritionAdviceWithAI,
  generateHealthPredictionsWithAI,
  AvailableHealthData
} from '@/lib/ai-report-helper';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const regenerate = searchParams.get('regenerate') === 'true';
    
    // Convert userId to ObjectId if it's a string
    let userId = session.user.id;
    // Store original userId format for later or conversion if needed
    let originalUserId = userId;

    // If not regenerating, try to fetch the latest report
    if (!regenerate) {
      const latestReport = await HealthReport.findOne({ 
        userId: originalUserId
      }).sort({ generatedAt: -1 });
      
      if (latestReport) {
        console.log("Found existing report:", latestReport._id);
        return NextResponse.json(latestReport);
      }
    }
    
    // If no report found or regenerate is true, create a new report
    console.log("Generating new health report for user:", originalUserId);
    const report = await generateHealthReport(originalUserId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json(
      { error: "Failed to fetch or generate report" },
      { status: 500 }
    );
  }
}

async function generateHealthReport(userId: string) {
  console.log("Starting report generation for userId:", userId);
  
  try {
    // Fetch user health metrics
    const healthMetrics = await HealthMetrics.findOne({ userId }).sort({ recordedAt: -1 });
    console.log("Health metrics found:", healthMetrics ? "Yes" : "No");
    
    // Get historical health data
    const healthHistory = await HealthMetricsHistory.find({ userId })
      .sort({ recordedAt: -1 })
      .limit(6);
    console.log("Health history records found:", healthHistory.length);
    
    // Get sleep data
    const sleepData = await Sleep.find({ userId })
      .sort({ date: -1 })
      .limit(30);
    console.log("Sleep records found:", sleepData.length);
    
    // Calculate BMI if height and weight are available
    let bmi;
    if (healthMetrics?.height && healthMetrics?.weight) {
      // BMI = weight(kg) / (height(m))²
      const heightInMeters = healthMetrics.height / 100; // Convert cm to meters
      bmi = parseFloat((healthMetrics.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Track which data is AI-generated
    const aiGenerated = {
      vitalSigns: false,
      nutritionAdvice: false,
      predictions: false,
      activityData: false,
      nutritionTrends: false
    };

    // Aggregate available data for AI processing
    const availableHealthData: AvailableHealthData = {
      healthMetrics: healthMetrics ? {
        height: healthMetrics.height,
        weight: healthMetrics.weight,
        age: healthMetrics.age,
        gender: healthMetrics.gender,
        bloodPressure: healthMetrics.bloodPressure,
        heartRate: healthMetrics.heartRate
      } : undefined,
      sleepData: sleepData.length > 0 ? sleepData.map(record => ({
        date: record.date,
        duration: record.duration,
        quality: record.quality
      })) : []
    };
    
    // Get nutrition data
    const startDate = subDays(new Date(), 30);
    const foodEntries = await FoodEntry.find({
      userId,
      recorded_at: { $gte: startDate }
    });
    console.log("Food entries found:", foodEntries.length);
    
    if (foodEntries.length > 0) {
      // Calculate average nutrition values
      const totalCalories = foodEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
      const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0);
      const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0);
      const totalFats = foodEntries.reduce((sum, entry) => sum + (entry.fats_g || 0), 0);
      
      const daysCount = Math.max(1, foodEntries.length);
      
      availableHealthData.nutritionData = {
        calories: Math.round(totalCalories / daysCount),
        protein_g: Math.round(totalProtein / daysCount),
        carbs_g: Math.round(totalCarbs / daysCount),
        fats_g: Math.round(totalFats / daysCount)
      };
    }

    // Calculate health score (example algorithm)
    const healthScore = calculateHealthScore(healthMetrics, sleepData, bmi);
    
    // Determine activity level based on age and other metrics
    const activityLevel = determineActivityLevel(healthMetrics, sleepData);
    
    // Determine risk level
    const riskLevel = determineRiskLevel(healthMetrics, bmi, sleepData);

    // Create mock data for nutrition trends if real data is not available
    let nutritionTrends = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      calories: [2100, 2050, 2200, 2150, 2300, 2250],
      protein: [75, 80, 78, 82, 85, 83],
      carbs: [230, 220, 240, 235, 250, 245],
      fats: [70, 65, 75, 72, 78, 76]
    };
    aiGenerated.nutritionTrends = true;

    // Generate vital signs data with mock data if needed
    let vitalSigns;
    try {
      if (healthHistory.length >= 5) {
        vitalSigns = await generateVitalSignsWithAI(availableHealthData);
      } else {
        const aiVitalSigns = await generateVitalSignsWithAI(availableHealthData);
        vitalSigns = [
          {
            title: "Blood Pressure",
            current: aiVitalSigns.bloodPressure.current,
            trend: aiVitalSigns.bloodPressure.trend,
            lastMeasured: aiVitalSigns.bloodPressure.lastMeasured,
            chartData: aiVitalSigns.bloodPressure.chartData
          },
          {
            title: "Heart Rate",
            current: aiVitalSigns.heartRate.current,
            trend: aiVitalSigns.heartRate.trend,
            lastMeasured: aiVitalSigns.heartRate.lastMeasured,
            chartData: aiVitalSigns.heartRate.chartData
          },
          {
            title: "Body Temperature",
            current: aiVitalSigns.temperature.current,
            trend: aiVitalSigns.temperature.trend,
            lastMeasured: aiVitalSigns.temperature.lastMeasured
          },
          {
            title: "Respiratory Rate",
            current: aiVitalSigns.respiratoryRate.current,
            trend: aiVitalSigns.respiratoryRate.trend,
            lastMeasured: aiVitalSigns.respiratoryRate.lastMeasured
          }
        ];
        aiGenerated.vitalSigns = true;
      }
    } catch (error) {
      console.error("Error generating vital signs:", error);
      // Fallback to mock data
      vitalSigns = [
        {
          title: "Blood Pressure",
          current: "120/80",
          trend: "stable",
          lastMeasured: "today",
          chartData: Array(7).fill(0).map((_, i) => ({ date: `Day ${i+1}`, value: 120 - Math.floor(Math.random() * 10) }))
        },
        {
          title: "Heart Rate",
          current: "72 bpm",
          trend: "stable",
          lastMeasured: "today",
          chartData: Array(7).fill(0).map((_, i) => ({ date: `Day ${i+1}`, value: 72 + Math.floor(Math.random() * 6) - 3 }))
        }
      ];
      aiGenerated.vitalSigns = true;
    }

    // Generate activity data with mock data
    let activityData = {
      daily: {
        "Steps": { value: "8,234", target: "10,000" },
        "Distance": { value: "5.2 km", target: "8 km" },
        "Active Minutes": { value: "42 min", target: "60 min" },
        "Calories Burned": { value: "384 cal", target: "500 cal" }
      },
      weeklyChart: Array(7).fill(0).map((_, i) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
        steps: 5000 + Math.floor(Math.random() * 5000),
        activeMinutes: 30 + Math.floor(Math.random() * 45)
      })),
      activityTypes: [
        { type: "Walking", duration: "35 min", calories: "180 cal" },
        { type: "Running", duration: "15 min", calories: "150 cal" },
        { type: "Cycling", duration: "20 min", calories: "120 cal" }
      ]
    };
    aiGenerated.activityData = true;

    // Generate nutrition data with mock data
    let nutritionData = {
      consumed: 1850,
      target: 2200,
      macros: {
        "Protein": { amount: "65g", target: "90g" },
        "Carbs": { amount: "210g", target: "250g" },
        "Fats": { amount: "60g", target: "70g" }
      },
      meals: [
        { meal: "Breakfast", time: "7:30 AM", calories: 450, items: "Oatmeal with fruits and nuts" },
        { meal: "Lunch", time: "12:30 PM", calories: 680, items: "Chicken salad with avocado" },
        { meal: "Snack", time: "3:30 PM", calories: 220, items: "Greek yogurt with berries" },
        { meal: "Dinner", time: "7:00 PM", calories: 500, items: "Grilled fish with vegetables" }
      ]
    };

    // Generate nutrition advice
    let nutritionAdvice;
    try {
      nutritionAdvice = {
        summary: "Based on your nutrition patterns, you could benefit from more protein and fewer processed carbohydrates. Consider increasing your vegetable intake and spreading your meals more evenly throughout the day.",
        recommendations: [
          "Increase protein intake to support muscle maintenance and repair.",
          "Add more leafy greens to your diet for essential micronutrients.",
          "Consider reducing added sugars and refined carbohydrates.",
          "Stay hydrated by drinking at least 8 glasses of water daily.",
          "Try to consume smaller, more frequent meals to maintain energy levels."
        ]
      };
      aiGenerated.nutritionAdvice = true;
    } catch (error) {
      console.error("Error generating nutrition advice:", error);
      // Fallback to mock data
      nutritionAdvice = {
        summary: "Based on available data, consider improving your nutrient balance.",
        recommendations: [
          "Increase protein intake to support muscle maintenance.",
          "Add more vegetables for essential vitamins and minerals.",
          "Stay hydrated with at least 8 glasses of water daily."
        ]
      };
      aiGenerated.nutritionAdvice = true;
    }

    // Generate health predictions
    let predictions;
    try {
      predictions = [
        {
          title: "Cardiovascular Health",
          prediction: "Your resting heart rate suggests good cardiovascular fitness. If you maintain your current activity level, you could see further improvements over the next 3-6 months.",
          recommendation: "Consider adding more varied cardio exercises like swimming or cycling.",
          timeframe: "3-6 months"
        },
        {
          title: "Weight Management",
          prediction: "Based on your current metrics, your weight appears stable. With minor adjustments to diet and exercise, you could optimize your BMI further.",
          recommendation: "Focus on strength training to increase metabolic rate.",
          timeframe: "2-4 months"
        },
        {
          title: "Energy Levels",
          prediction: "Your sleep patterns suggest you may be experiencing energy fluctuations during the day.",
          recommendation: "Consider more consistent sleep and wake times to stabilize energy.",
          timeframe: "2-3 weeks"
        }
      ];
      aiGenerated.predictions = true;
    } catch (error) {
      console.error("Error generating predictions:", error);
      // Fallback to mock data
      predictions = [
        {
          title: "Health Maintenance",
          prediction: "With your current habits, you're likely to maintain your health status.",
          recommendation: "Regular check-ups can help monitor any changes.",
          timeframe: "6-12 months"
        }
      ];
      aiGenerated.predictions = true;
    }

    // Create a summary of the report
    const summary = generateSummary(healthScore, activityLevel, bmi, riskLevel);

    console.log("Report data prepared, creating document");

    // Create and save the new report
    const newReport = new HealthReport({
      userId,
      title: `Health Report - ${new Date().toLocaleDateString()}`,
      generatedAt: new Date(),
      summary,
      healthScore,
      activityLevel,
      bmi,
      riskLevel,
      healthMetrics: {
        height: healthMetrics?.height,
        weight: healthMetrics?.weight,
        age: healthMetrics?.age,
        gender: healthMetrics?.gender
      },
      nutritionTrends,
      vitalSigns,
      activityData,
      nutritionData,
      nutritionAdvice,
      predictions,
      aiGenerated
    });

    await newReport.save();
    console.log("New report saved with ID:", newReport._id);
    
    return newReport;
  } catch (error) {
    console.error("Error in generateHealthReport:", error);
    throw error; // Re-throw to be caught by the route handler
  }
}

function calculateHealthScore(healthMetrics: any, sleepData: any[], bmi: number | undefined) {
  let score = 0;

  // Example scoring algorithm
  if (healthMetrics) {
    if (healthMetrics.bloodPressure) {
      const [systolic, diastolic] = healthMetrics.bloodPressure.split('/').map(Number);
      if (systolic < 120 && diastolic < 80) {
        score += 20;
      } else if (systolic < 130 && diastolic < 85) {
        score += 15;
      } else {
        score += 10;
      }
    }

    if (healthMetrics.heartRate) {
      if (healthMetrics.heartRate >= 60 && healthMetrics.heartRate <= 100) {
        score += 20;
      } else {
        score += 10;
      }
    }
  }

  if (bmi !== undefined) {
    if (bmi >= 18.5 && bmi <= 24.9) {
      score += 20;
    } else if (bmi >= 25 && bmi <= 29.9) {
      score += 10;
    } else {
      score += 5;
    }
  }

  const averageSleepQuality = sleepData.reduce((sum, record) => sum + record.quality, 0) / sleepData.length;
  if (averageSleepQuality >= 4) {
    score += 20;
  } else if (averageSleepQuality >= 2) {
    score += 10;
  } else {
    score += 5;
  }

  return score;
}

async function generateActivityData(userId: string) {
  // Fetch activity data for the user
  const activityData = {
    steps: 6892,
    distance: 4.2,
    activeMinutes: 45,
    caloriesBurned: 384,
    
    // Hourly breakdown
    timeline: [
      { time: '06:00', steps: 200, activeMinutes: 5 },
      { time: '08:00', steps: 1200, activeMinutes: 15 },
      { time: '10:00', steps: 2000, activeMinutes: 10 },
      { time: '12:00', steps: 3500, activeMinutes: 20 },
      { time: '14:00', steps: 4200, activeMinutes: 15 },
      { time: '16:00', steps: 5300, activeMinutes: 25 },
      { time: '18:00', steps: 6200, activeMinutes: 30 },
      { time: '20:00', steps: 6800, activeMinutes: 15 },
      { time: '22:00', steps: 6900, activeMinutes: 5 },
    ]
  }; // This could be replaced with actual activity data from a model

  // If no activity data is found, return an empty array
  if (!activityData.timeline.length) {
    return [];
  }

  // Process activity data to calculate trends and summaries
  const totalSteps = activityData.timeline.reduce((sum: any, record: { steps: any; }) => sum + (record.steps || 0), 0);
  const totalActiveMinutes = activityData.timeline.reduce((sum: any, record: { activeMinutes: any; }) => sum + (record.activeMinutes || 0), 0);

  const averageSteps = Math.round(totalSteps / activityData.timeline.length);
  const averageActiveMinutes = Math.round(totalActiveMinutes / activityData.timeline.length);

  return {
    averageSteps,
    averageActiveMinutes,
    activityData: activityData.timeline.map((record: { time: any; steps: any; activeMinutes: any; }) => ({
      time: record.time,
      steps: record.steps,
      activeMinutes: record.activeMinutes
    }))
  };
}

async function generateNutritionData(userId: string) {
  // Fetch food entries for the user
  const startDate = subDays(new Date(), 30);
  const foodEntries = await FoodEntry.find({
    userId,
    recorded_at: { $gte: startDate }
  });

  // If no food entries are found, return an empty object
  if (!foodEntries.length) {
    return {};
  }

  // Calculate total and average nutrition values
  const totalCalories = foodEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0);
  const totalFats = foodEntries.reduce((sum, entry) => sum + (entry.fats_g || 0), 0);

  const daysCount = Math.max(1, foodEntries.length);

  return {
    averageCalories: Math.round(totalCalories / daysCount),
    averageProtein_g: Math.round(totalProtein / daysCount),
    averageCarbs_g: Math.round(totalCarbs / daysCount),
    averageFats_g: Math.round(totalFats / daysCount),
    foodEntries: foodEntries.map(entry => ({
      date: entry.recorded_at,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fats_g: entry.fats_g
    }))
  };
}
// Removed duplicate function implementation
function determineActivityLevel(healthMetrics: any, sleepData: any[]) {
  // Example algorithm to determine activity level
  let activityLevel = "Low";

  // Check if health metrics and sleep data are available
  if (healthMetrics && sleepData.length > 0) {
    const averageSleepDuration = sleepData.reduce((sum, record) => sum + record.duration, 0) / sleepData.length;

    // Determine activity level based on average sleep duration and heart rate
    if (averageSleepDuration >= 7 && healthMetrics.heartRate >= 60 && healthMetrics.heartRate <= 100) {
      activityLevel = "High";
    } else if (averageSleepDuration >= 5) {
      activityLevel = "Moderate";
    }
  }

  return activityLevel;
}
function determineRiskLevel(healthMetrics: any, bmi: number | undefined, sleepData: any[]) {
  let riskLevel = "Low";

  if (healthMetrics) {
    const { bloodPressure, heartRate } = healthMetrics;

    if (bloodPressure) {
      const [systolic, diastolic] = bloodPressure.split('/').map(Number);
      if (systolic >= 140 || diastolic >= 90) {
        riskLevel = "High";
      } else if (systolic >= 130 || diastolic >= 85) {
        riskLevel = "Moderate";
      }
    }

    if (heartRate && (heartRate < 60 || heartRate > 100)) {
      riskLevel = "Moderate";
    }
  }

  if (bmi !== undefined) {
    if (bmi < 18.5 || bmi >= 30) {
      riskLevel = "High";
    } else if (bmi >= 25) {
      riskLevel = "Moderate";
    }
  }

  const averageSleepQuality = sleepData.reduce((sum, record) => sum + record.quality, 0) / sleepData.length;
  if (averageSleepQuality < 2) {
    riskLevel = "High";
  } else if (averageSleepQuality < 4) {
    riskLevel = "Moderate";
  }

  return riskLevel;
}
function generateSummary(healthScore: number, activityLevel: string, bmi: number | undefined, riskLevel: string) {
  const bmiText = bmi !== undefined ? `Your BMI is ${bmi}, which is considered ${getBmiCategory(bmi)}.` : "BMI data is not available.";
  const summary = `
    Health Score: ${healthScore}/100
    Activity Level: ${activityLevel}
    Risk Level: ${riskLevel}
    ${bmiText}
  `;
  return summary.trim();
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return "underweight";
  if (bmi >= 18.5 && bmi <= 24.9) return "normal weight";
  if (bmi >= 25 && bmi <= 29.9) return "overweight";
  return "obese";
}


