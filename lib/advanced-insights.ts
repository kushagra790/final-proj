'use server';

import { generateTextToText } from "./ai-service";

/**
 * Generates long-term trend analysis for sleep data
 */
export async function generateSleepTrendAnalysis(sleepData: any[]): Promise<string> {
  if (!sleepData || sleepData.length < 7) {
    return "Not enough sleep data for trend analysis. Please track at least 7 days of sleep.";
  }

  const prompt = `
You are a sleep scientist analyzing long-term sleep data for a user. 
Based on the following ${sleepData.length} sleep records, provide a detailed analysis focusing on:

${JSON.stringify(sleepData.map(record => ({
  date: record.date,
  duration: record.duration,
  quality: record.quality,
  startTime: record.startTime,
  endTime: record.endTime
})))}

1. Long-term patterns and cycles detected
2. Week-over-week or month-over-month changes
3. Correlation between sleep duration and quality 
4. Scientific explanation of the observed patterns
5. Three specific, evidence-based recommendations to improve their sleep health

Format your response with clear section headings, bullet points where appropriate, and conclude with actionable recommendations. Keep the analysis between 300-400 words.
`;

  try {
    const analysis = await generateTextToText(prompt);
    return analysis;
  } catch (error) {
    console.error("Error generating sleep trend analysis:", error);
    return "Unable to generate detailed sleep analysis at this time. Please try again later.";
  }
}

/**
 * Generates personalized activity plan based on current activity data
 */
export async function generatePersonalActivityPlan(activityData: any): Promise<string> {
  if (!activityData) {
    return "No activity data available to generate a personalized plan.";
  }

  const prompt = `
You are a certified fitness coach designing a personalized activity plan.
Based on the following activity metrics, create a 7-day activity plan:

- Current Steps: ${activityData.steps || 0} of 10,000 goal
- Current Distance: ${activityData.distance || 0} km of 5 km goal
- Current Active Minutes: ${activityData.activeMinutes || 0} of 60 min goal
- Current Calories Burned: ${activityData.caloriesBurned || 0} of 500 goal

Create a structured 7-day activity plan that:
1. Builds progressively on their current metrics
2. Includes specific daily targets for each metric
3. Suggests 2-3 specific activities each day (walking, jogging, cycling, etc.)
4. Balances active days with recovery days
5. Is realistic and achievable based on their current levels

Format your response as a day-by-day plan with clear targets and activities for each day.
Keep the plan under 400 words total.
`;

  try {
    const plan = await generateTextToText(prompt);
    return plan;
  } catch (error) {
    console.error("Error generating activity plan:", error);
    return "Unable to generate personalized activity plan at this time. Please try again later.";
  }
}

/**
 * Generates a personalized diet plan based on nutrition data
 */
export async function generateDietPlan(nutritionData: any): Promise<string> {
  if (!nutritionData) {
    return "No nutrition data available to generate a diet plan.";
  }

  const prompt = `
You are a registered dietitian creating a personalized meal plan.
Based on the following current macronutrient intake:

- Total Calories: ${nutritionData.calories || 0}/2,200 goal
- Protein: ${nutritionData.protein_g || 0}g/90g goal
- Carbohydrates: ${nutritionData.carbs_g || 0}g/250g goal
- Fat: ${nutritionData.fats_g || 0}g/70g goal

Create a practical 3-day meal plan that:
1. Helps the user reach their macronutrient targets
2. Includes specific meals (breakfast, lunch, dinner, and snacks)
3. Uses common, accessible ingredients
4. Provides approximate macros for each suggested meal
5. Addresses any obvious imbalances in their current intake

Present the meal plan in a clear day-by-day format with specific meal suggestions.
Keep the plan under 400 words.
`;

  try {
    const dietPlan = await generateTextToText(prompt);
    return dietPlan;
  } catch (error) {
    console.error("Error generating diet plan:", error);
    return "Unable to generate personalized diet plan at this time. Please try again later.";
  }
}

/**
 * Generates a workout program based on exercise data
 */
export async function generateWorkoutProgram(exerciseData: any): Promise<string> {
  if (!exerciseData || !exerciseData.logs || exerciseData.logs.length === 0) {
    return "No exercise data available to generate a workout program.";
  }

  const prompt = `
You are a certified personal trainer designing a progressive workout program.
Based on the user's exercise history and current stats:

Current stats:
- Exercises completed: ${exerciseData.stats?.completed || 0} today
- Total sets: ${exerciseData.stats?.totalSets || 0}
- Total reps: ${exerciseData.stats?.totalReps || 0}
- Calories burned: ${exerciseData.stats?.totalCalories || 0}

Recent exercise logs:
${JSON.stringify(exerciseData.logs.slice(0, 5).map((log: { name: any; category: any; sets: any; reps: any; date: any; }) => ({
  name: log.name,
  category: log.category,
  sets: log.sets,
  reps: log.reps,
  date: log.date
})))}

Design a structured 4-week workout program that:
1. Builds upon their current exercise patterns
2. Progressively increases volume and intensity
3. Ensures balanced training across major muscle groups
4. Includes 3-4 workout days per week with specific exercises
5. Provides specific sets, reps, and rest periods for each exercise

Present the program week by week, with specific workouts for each day.
Keep the program under 500 words.
`;

  try {
    const program = await generateTextToText(prompt);
    return program;
  } catch (error) {
    console.error("Error generating workout program:", error);
    return "Unable to generate personalized workout program at this time. Please try again later.";
  }
}

/**
 * Generates a personalized exercise plan based on user health metrics and environment (home/gym)
 */
export async function generateExercisePlan(healthMetrics: any, environment: 'home' | 'gym'): Promise<string> {
  if (!healthMetrics) {
    return "No health metrics available to generate an exercise plan.";
  }

  // Calculate BMI for additional context
  const heightInMeters = healthMetrics.height / 100;
  const bmi = healthMetrics.weight / (heightInMeters * heightInMeters);

  const prompt = `
You are a certified personal trainer creating a personalized ${environment} exercise plan.
Based on the following health metrics:

- Age: ${healthMetrics.age || 30} years
- Gender: ${healthMetrics.gender || 'Not specified'}
- Weight: ${healthMetrics.weight || 70} kg
- Height: ${healthMetrics.height || 170} cm
- BMI: ${bmi.toFixed(1)} (${getBmiCategory(bmi)})
- Activity Level: ${healthMetrics.activityLevel || 'moderate'}
- Fitness Goals: ${healthMetrics.fitnessGoals || 'General fitness improvement'}
- Chronic Conditions: ${healthMetrics.chronicConditions || 'None reported'}

Create a comprehensive 7-day ${environment} exercise plan. For each day, structure your response exactly as follows:

## Day 1: [Focus Area - e.g., Upper Body, Lower Body, etc.]
Focus: [Main muscle groups targeted]

### Warm-up:
[Brief warm-up instructions]

### Exercises:
**[Exercise 1 Name]** - [Brief description]
- Sets: [number]
- Reps: [number or range]
- Target muscles: [muscle groups]
- Form tips: [1-2 key form instructions]

**[Exercise 2 Name]** - [Brief description]
- Sets: [number]
- Reps: [number or range]
- Target muscles: [muscle groups]
- Form tips: [1-2 key form instructions]

[Continue with 4-6 exercises total]

### Cool-down:
[Brief cool-down instructions]

[Repeat this exact format for Days 2-7]

The plan should:
1. Be tailored to their current fitness level (${healthMetrics.activityLevel || 'moderate'})
2. Include specific exercises with sets, reps, and form tips
3. Provide a balanced approach targeting all major muscle groups
4. Include 1-2 rest days positioned appropriately
5. For each day, include 4-6 specific exercises that can be performed at ${environment === 'home' ? 'home with minimal equipment' : 'a standard gym with typical equipment'}

For REST days, simply indicate it's a rest day and provide recovery suggestions.
`;

  try {
    const plan = await generateTextToText(prompt);
    return plan;
  } catch (error) {
    console.error(`Error generating ${environment} exercise plan:`, error);
    return `Unable to generate personalized ${environment} exercise plan at this time. Please try again later.`;
  }
}

// Helper function to categorize BMI
function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
