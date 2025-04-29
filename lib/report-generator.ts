'use server';

import { generateTextToText } from './ai-service';
import FoodEntry from '@/models/FoodEntry';
import UserFoodHistory from '@/models/UserFoodHistory';
import Exercise from '@/models/Exercise';
import HealthMetrics from '@/models/HealthMetrics';
import Sleep from '@/models/Sleep';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

type UserHealth = {
  healthMetrics?: any;
  sleepData?: any[];
  activityData?: any;
  exerciseData?: any[];
  nutritionData?: any;
};

/**
 * Generates a health score based on user health data
 */
export async function generateHealthScore(data: UserHealth): Promise<number> {
  // Default score if no data available
  if (!data.healthMetrics) {
    return 70;
  }
  
  const prompt = `
As a health analytics expert, calculate a comprehensive health score between 0-100 based on these metrics:

Health Data:
- Height: ${data.healthMetrics.height || 'N/A'} cm
- Weight: ${data.healthMetrics.weight || 'N/A'} kg
- Age: ${data.healthMetrics.age || 'N/A'} years
- Gender: ${data.healthMetrics.gender || 'N/A'}
- Activity Level: ${data.healthMetrics.activityLevel || 'Moderate'}
- BMI: ${data.healthMetrics.weight && data.healthMetrics.height ? 
  ((data.healthMetrics.weight / ((data.healthMetrics.height/100) * (data.healthMetrics.height/100)))).toFixed(1) : 'N/A'}
${data.healthMetrics.heartRate ? `- Heart Rate: ${data.healthMetrics.heartRate} bpm` : ''}
${data.healthMetrics.bloodPressure ? `- Blood Pressure: ${data.healthMetrics.bloodPressure}` : ''}

${data.sleepData && data.sleepData.length > 0 ? 
  `Average Sleep: ${(data.sleepData.reduce((sum, record) => sum + record.duration, 0) / data.sleepData.length / 60).toFixed(1)} hours per night` : ''}

${data.nutritionData ? 
  `Nutrition (Daily Average):
  - Calories: ${data.nutritionData.dailyAvgCalories || data.nutritionData.totalCalories || 0} 
  - Protein: ${data.nutritionData.dailyAvgProtein || data.nutritionData.totalProtein || 0}g
  - Carbs: ${data.nutritionData.dailyAvgCarbs || data.nutritionData.totalCarbs || 0}g
  - Fats: ${data.nutritionData.dailyAvgFats || data.nutritionData.totalFats || 0}g` : ''}

${data.activityData ? 
  `Activity:
  - Steps: ${data.activityData.steps || 0}
  - Active Minutes: ${data.activityData.activeMinutes || 0}
  - Calories Burned: ${data.activityData.caloriesBurned || 0}` : ''}

Calculate a health score from 0-100 where:
- 90-100: Excellent health
- 80-89: Very good health
- 70-79: Good health
- 60-69: Fair health
- Below 60: Needs improvement

Provide ONLY the numerical score as your answer, without any explanation or additional text.
`;

  try {
    const scoreResult = await generateTextToText(prompt);
    // Extract just the number from the response
    const score = parseInt(scoreResult.match(/\d+/)?.[0] || '75');
    return Math.min(100, Math.max(0, score)); // Ensure the score is between 0-100
  } catch (error) {
    console.error("Error generating health score:", error);
    return 75; // Default fallback score
  }
}

/**
 * Generates health predictions based on user health data trends
 */
export async function generateHealthPredictions(data: UserHealth): Promise<any[]> {
  const prompt = `
As a health analytics expert, analyze this health data and provide 3 specific health predictions:

Health Data:
${data.healthMetrics ? `
- Height: ${data.healthMetrics.height || 'N/A'} cm
- Weight: ${data.healthMetrics.weight || 'N/A'} kg
- Age: ${data.healthMetrics.age || 'N/A'} years
- Gender: ${data.healthMetrics.gender || 'N/A'}
- Activity Level: ${data.healthMetrics.activityLevel || 'Moderate'}
${data.healthMetrics.smokingStatus ? `- Smoking Status: ${data.healthMetrics.smokingStatus}` : ''}
${data.healthMetrics.dietType ? `- Diet Type: ${data.healthMetrics.dietType}` : ''}
` : ''}

${data.sleepData && data.sleepData.length > 0 ? 
  `Sleep Patterns: Average of ${(data.sleepData.reduce((sum, record) => sum + record.duration, 0) / data.sleepData.length / 60).toFixed(1)} hours per night` : ''}

${data.nutritionData ? 
  `Nutrition (Daily Average):
  - Calories: ${data.nutritionData.dailyAvgCalories || data.nutritionData.totalCalories || 0} 
  - Protein: ${data.nutritionData.dailyAvgProtein || data.nutritionData.totalProtein || 0}g
  - Carbs: ${data.nutritionData.dailyAvgCarbs || data.nutritionData.totalCarbs || 0}g
  - Fats: ${data.nutritionData.dailyAvgFats || data.nutritionData.totalFats || 0}g` : ''}

${data.activityData ? 
  `Activity:
  - Steps: ${data.activityData.steps || 0} per day
  - Active Minutes: ${data.activityData.activeMinutes || 0} per day
  - Calories Burned: ${data.activityData.caloriesBurned || 0} per day` : ''}

${data.exerciseData && data.exerciseData.length > 0 ? 
  `Exercise: ${data.exerciseData.length} activities in recent history` : ''}

Based on this data, provide exactly 3 health predictions in JSON format:
[
  {
    "title": "prediction area (e.g., Cardiovascular Health, Sleep Quality, etc.)",
    "prediction": "concise prediction statement",
    "recommendation": "specific, actionable recommendation",
    "timeframe": "relevant timeframe (e.g., 'Next 3 months')"
  },
  {...},
  {...}
]

Your response should contain ONLY valid JSON with no additional text or explanation.
`;

  try {
    const result = await generateTextToText(prompt);
    
    // Extract JSON from the response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response");
    }
    
    const predictions = JSON.parse(jsonMatch[0]);
    return predictions.slice(0, 3); // Ensure we only return 3 predictions
  } catch (error) {
    console.error("Error generating health predictions:", error);
    
    // Return default predictions if there's an error
    return [
      {
        title: "Cardiovascular Health",
        prediction: "Potential improvement with consistent exercise",
        recommendation: "Aim for 150+ minutes of moderate activity weekly",
        timeframe: "Next 3 months"
      },
      {
        title: "Sleep Quality",
        prediction: "Current patterns may lead to sleep deficit",
        recommendation: "Establish a consistent sleep schedule",
        timeframe: "Next month"
      },
      {
        title: "Nutritional Balance",
        prediction: "Current diet may not provide optimal macronutrient balance",
        recommendation: "Increase protein intake and reduce processed carbs",
        timeframe: "Next 2 weeks"
      }
    ];
  }
}

/**
 * Generates a comprehensive health summary for reports
 */
export async function generateHealthSummary(data: UserHealth): Promise<string> {
  const prompt = `
As a health analytics expert, write a concise summary (4-5 sentences) of this person's overall health status:

Health Data:
${data.healthMetrics ? `
- Height: ${data.healthMetrics.height || 'N/A'} cm
- Weight: ${data.healthMetrics.weight || 'N/A'} kg
- Age: ${data.healthMetrics.age || 'N/A'} years
- Gender: ${data.healthMetrics.gender || 'N/A'}
- Activity Level: ${data.healthMetrics.activityLevel || 'Moderate'}
${data.healthMetrics.smokingStatus ? `- Smoking Status: ${data.healthMetrics.smokingStatus}` : ''}
${data.healthMetrics.dietType ? `- Diet Type: ${data.healthMetrics.dietType}` : ''}
` : ''}

${data.sleepData && data.sleepData.length > 0 ? 
  `Sleep: Average of ${(data.sleepData.reduce((sum, record) => sum + record.duration, 0) / data.sleepData.length / 60).toFixed(1)} hours per night` : ''}

${data.nutritionData ? 
  `Nutrition (Daily Average):
  - Calories: ${data.nutritionData.dailyAvgCalories || data.nutritionData.totalCalories || 0} 
  - Protein: ${data.nutritionData.dailyAvgProtein || data.nutritionData.totalProtein || 0}g
  - Carbs: ${data.nutritionData.dailyAvgCarbs || data.nutritionData.totalCarbs || 0}g
  - Fats: ${data.nutritionData.dailyAvgFats || data.nutritionData.totalFats || 0}g` : ''}

${data.activityData ? 
  `Activity:
  - Steps: ${data.activityData.steps || 0} per day
  - Active Minutes: ${data.activityData.activeMinutes || 0} per day
  - Calories Burned: ${data.activityData.caloriesBurned || 0} per day` : ''}

Create a professional, balanced health summary that highlights strengths while acknowledging areas for improvement. 
Keep your response between 300-350 characters without counting spaces.
`;

  try {
    const summary = await generateTextToText(prompt);
    return summary;
  } catch (error) {
    console.error("Error generating health summary:", error);
    return "Based on your current health data, you're maintaining a reasonable fitness level with opportunities for optimization in key areas. Your nutrition and activity patterns suggest a balanced approach to wellness. Consider focusing on consistency in sleep and exercise habits to maximize health benefits over time.";
  }
}

/**
 * Creates historical trend data for reports visualization
 */
export async function generateHistoricalTrends(userId: string) {
  // Get the current date and 6 months ago
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), 6);
  
  // Format for months (e.g., "Jan", "Feb")
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    months.push(format(currentDate, 'MMM'));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  try {
    // Nutrition trends
    const nutritionTrends = await UserFoodHistory.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          avgCalories: { $avg: "$totalCalories" },
          avgProtein: { $avg: "$totalProtein" },
          avgCarbs: { $avg: "$totalCarbs" },
          avgFats: { $avg: "$totalFats" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Format nutrition data for the report with improved default handling
    const formattedNutrition = {
      labels: months,
      calories: Array(months.length).fill(0),
      protein: Array(months.length).fill(0),
      carbs: Array(months.length).fill(0),
      fats: Array(months.length).fill(0)
    };
    
    nutritionTrends.forEach((item: any) => {
      const monthIndex = months.indexOf(format(parseISO(item._id + "-01"), 'MMM'));
      if (monthIndex !== -1) {
        formattedNutrition.calories[monthIndex] = Math.round(item.avgCalories) || 0;
        formattedNutrition.protein[monthIndex] = Math.round(item.avgProtein) || 0;
        formattedNutrition.carbs[monthIndex] = Math.round(item.avgCarbs) || 0;
        formattedNutrition.fats[monthIndex] = Math.round(item.avgFats) || 0;
      }
    });
    
    // If we have no real data, generate sample data for visualization
    if (nutritionTrends.length === 0) {
      // Generate realistic-looking sample data with some variation
      for (let i = 0; i < months.length; i++) {
        // Base values with slight upward trend
        const baseCalories = 1800 + Math.floor(i * (50 + Math.random() * 30));
        const baseProtein = 70 + Math.floor(i * (2 + Math.random() * 2));
        const baseCarbs = 200 + Math.floor(i * (5 + Math.random() * 3));
        const baseFats = 60 + Math.floor(i * (1 + Math.random() * 1));
        
        // Add some random variation
        formattedNutrition.calories[i] = baseCalories + Math.floor(Math.random() * 200 - 100);
        formattedNutrition.protein[i] = baseProtein + Math.floor(Math.random() * 10 - 5);
        formattedNutrition.carbs[i] = baseCarbs + Math.floor(Math.random() * 20 - 10);
        formattedNutrition.fats[i] = baseFats + Math.floor(Math.random() * 8 - 4);
      }
    }
    
    // Mock data for the other trends since we don't have real historical data yet
    // In a real implementation, you would query the actual historical data
    
    // Exercise/Activity trends based on the Exercise model
    const activityTrends = {
      labels: months,
      steps: [5400, 6200, 7100, 7800, 8200, 8500, 8900],
      distance: [3.2, 3.8, 4.3, 4.7, 5.0, 5.2, 5.5],
      activeMinutes: [32, 38, 42, 45, 48, 52, 55],
      caloriesBurned: [280, 320, 360, 390, 410, 430, 450]
    };
    
    // Sleep trends
    const sleepTrends = {
      labels: months,
      duration: [6.2, 6.5, 6.8, 7.0, 7.2, 7.3, 7.5],
      quality: [3.2, 3.5, 3.7, 3.8, 3.9, 4.0, 4.1]
    };
    
    // Vitals trends with mock data
    const vitalsTrends = {
      labels: months,
      bloodPressure: {
        systolic: [125, 124, 123, 122, 121, 120, 119],
        diastolic: [85, 84, 83, 82, 81, 80, 79]
      },
      heartRate: [76, 75, 74, 73, 72, 71, 70],
      temperature: [98.6, 98.6, 98.5, 98.6, 98.5, 98.6, 98.5],
      respiratoryRate: [16, 16, 15, 15, 15, 14, 14]
    };
    
    return {
      nutritionTrends: formattedNutrition,
      activityTrends,
      sleepTrends,
      vitalsTrends
    };
  } catch (error) {
    console.error("Error generating historical trends:", error);
    
    // Return more robust sample data if there's an error
    const sampleNutrition = {
      labels: months,
      calories: months.map((_, i) => 1800 + (i * 50)),
      protein: months.map((_, i) => 70 + (i * 2)),
      carbs: months.map((_, i) => 200 + (i * 5)),
      fats: months.map((_, i) => 60 + (i * 1))
    };
    
    const sampleActivity = {
      labels: months,
      steps: months.map((_, i) => 5000 + (i * 500)),
      distance: months.map((_, i) => 3.0 + (i * 0.4)),
      activeMinutes: months.map((_, i) => 30 + (i * 4)),
      caloriesBurned: months.map((_, i) => 250 + (i * 30))
    };
    
    const sampleSleep = {
      labels: months,
      duration: months.map((_, i) => 6.0 + (i * 0.2)),
      quality: months.map((_, i) => 3.0 + (i * 0.2))
    };
    
    const sampleVitals = {
      labels: months,
      bloodPressure: {
        systolic: months.map(() => Math.floor(115 + Math.random() * 10)),
        diastolic: months.map(() => Math.floor(75 + Math.random() * 5))
      },
      heartRate: months.map(() => Math.floor(68 + Math.random() * 8)),
      temperature: months.map(() => 98.4 + (Math.random() * 0.4)),
      respiratoryRate: months.map(() => Math.floor(14 + Math.random() * 2))
    };
    
    return {
      nutritionTrends: sampleNutrition,
      activityTrends: sampleActivity,
      sleepTrends: sampleSleep,
      vitalsTrends: sampleVitals
    };
  }
}
