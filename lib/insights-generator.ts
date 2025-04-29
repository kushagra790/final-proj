import { generateTextToText } from "./ai-service";

// Specialized insight generators for each tracking feature
export async function generateSleepInsights(sleepData: any[]): Promise<string> {
  if (!sleepData || sleepData.length === 0) {
    return "No sleep data available to generate insights.";
  }

  const prompt = `
You are a health coach reviewing a user's sleep data. 
Based on the following sleep records for the past ${sleepData.length} days, provide 3-4 concise bullet points of insights and personalized recommendations:

${JSON.stringify(sleepData.map(record => ({
  date: record.date,
  duration: record.duration, // in minutes
  quality: record.quality,
  startTime: record.startTime,
  endTime: record.endTime
})))}

Focus on:
- Patterns in sleep duration and quality 
- Consistency of sleep and wake times
- Areas for improvement
- Concrete, actionable advice to improve sleep health

Format the response with bullet points and keep it under 200 words.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating sleep insights:", error);
    return "Unable to generate sleep insights at this time. Please try again later.";
  }
}

export async function generateActivityInsights(activityData: any): Promise<string> {
  if (!activityData) {
    return "No activity data available to generate insights.";
  }

  const prompt = `
You are a fitness coach analyzing a user's daily activity data. 
Based on the following activity metrics, provide 3-4 concise bullet points of insights and personalized recommendations:

- Steps: ${activityData.steps || 0} (goal: 10,000)
- Distance: ${activityData.distance || 0} km (goal: 5 km)
- Active Minutes: ${activityData.activeMinutes || 0} (goal: 60 min)
- Calories Burned: ${activityData.caloriesBurned || 0} (goal: 500)
- Timeline data points: ${activityData.timeline ? activityData.timeline.length : 0}

Focus on:
- Progress towards daily goals
- Activity distribution throughout the day (if timeline data exists)
- Areas for improvement
- Specific, actionable suggestions to increase physical activity

Format the response with bullet points and keep it under 200 words.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating activity insights:", error);
    return "Unable to generate activity insights at this time. Please try again later.";
  }
}

export async function generateNutritionInsights(nutritionData: any): Promise<string> {
  if (!nutritionData) {
    return "No nutrition data available to generate insights.";
  }

  const prompt = `
You are a nutritionist reviewing a user's daily nutrition intake. 
Based on the following macronutrient data, provide 3-4 concise bullet points of insights and personalized recommendations:

- Total Calories: ${nutritionData.calories || 0} (goal: 2,200)
- Protein: ${nutritionData.protein_g || 0}g (goal: 90g)
- Carbohydrates: ${nutritionData.carbs_g || 0}g (goal: 250g)
- Fat: ${nutritionData.fats_g || 0}g (goal: 70g)

Focus on:
- Macronutrient balance
- Areas that need improvement
- How the user's intake compares to recommended values
- Specific food suggestions to improve their nutrition

Format the response with bullet points and keep it under 200 words.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating nutrition insights:", error);
    return "Unable to generate nutrition insights at this time. Please try again later.";
  }
}

export async function generateExerciseInsights(exerciseData: any): Promise<string> {
  if (!exerciseData || !exerciseData.logs || exerciseData.logs.length === 0) {
    return "No exercise data available to generate insights.";
  }

  const prompt = `
You are a personal trainer analyzing a user's exercise history. 
Based on the following exercise data from their recent workouts, provide 3-4 concise bullet points of insights and personalized recommendations:

Exercise stats for today:
- Exercises completed: ${exerciseData.stats?.completed || 0}
- Total sets: ${exerciseData.stats?.totalSets || 0}
- Total reps: ${exerciseData.stats?.totalReps || 0}
- Calories burned: ${exerciseData.stats?.totalCalories || 0}

Recent exercise logs (up to 7):
${JSON.stringify(exerciseData.logs.slice(0, 7).map((log: { name: any; category: any; sets: any; reps: any; caloriesBurned: any; date: any; }) => ({
  name: log.name,
  category: log.category,
  sets: log.sets,
  reps: log.reps,
  caloriesBurned: log.caloriesBurned,
  date: log.date
})))}

Focus on:
- Exercise variety and balance
- Workout intensity and volume
- Progress patterns
- Specific recommendations to improve their fitness routine

Format the response with bullet points and keep it under 200 words.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating exercise insights:", error);
    return "Unable to generate exercise insights at this time. Please try again later.";
  }
}
