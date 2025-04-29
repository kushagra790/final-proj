'use server';

import { generateTextToText } from './ai-service';

interface INutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  [key: string]: any;
}

/**
 * Generates insights about the user's macronutrient balance
 */
export async function generateMacroBalanceInsights(nutritionData: INutritionData): Promise<string> {
  const prompt = `
As a nutritionist, analyze this user's macronutrient intake:
- Calories: ${nutritionData.calories} kcal
- Protein: ${nutritionData.protein_g}g
- Carbohydrates: ${nutritionData.carbs_g}g 
- Fats: ${nutritionData.fats_g}g

Calculate the percentages:
- Protein: ${Math.round((nutritionData.protein_g * 4 / nutritionData.calories) * 100)}%
- Carbs: ${Math.round((nutritionData.carbs_g * 4 / nutritionData.calories) * 100)}%
- Fats: ${Math.round((nutritionData.fats_g * 9 / nutritionData.calories) * 100)}%

Analyze if this macronutrient distribution is optimal based on general nutritional guidelines.
Provide 3-4 actionable recommendations for improving or maintaining this balance.
Write in a professional but friendly tone, keeping your response under 300 characters.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating macro balance insights:", error);
    return "Your macronutrient balance appears reasonable, but consider increasing protein intake slightly for optimal muscle maintenance. Focus on whole food carbohydrate sources and ensure adequate healthy fat consumption from sources like olive oil, avocados, and nuts.";
  }
}

/**
 * Analyzes meal timing patterns and makes recommendations
 */
export async function generateMealTimingInsights(mealData: any[]): Promise<string> {
  // Extract meal times and organize them
  let mealTimes: string[] = [];
  let mealGaps: number[] = [];
  let previousTime: number | null = null;
  
  mealData.forEach(meal => {
    if (meal.time) {
      mealTimes.push(meal.time);
      
      // Calculate time gaps between meals
      const timeMatch = meal.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let [_, hours, minutes, ampm] = timeMatch;
        let hour = parseInt(hours);
        if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
        
        const timeInMinutes = hour * 60 + parseInt(minutes);
        
        if (previousTime !== null) {
          mealGaps.push(timeInMinutes - previousTime);
        }
        
        previousTime = timeInMinutes;
      }
    }
  });

  const prompt = `
As a nutrition expert, analyze this meal timing pattern:
${mealTimes.join(', ')}

Average time between meals: ${
    mealGaps.length > 0 
      ? Math.round(mealGaps.reduce((a, b) => a + b, 0) / mealGaps.length / 60 * 10) / 10 
      : 'Unknown'
  } hours

Provide 2-3 concise, actionable recommendations about meal timing for optimal energy levels and metabolism.
Your response should be under 250 characters.
`;

  try {
    const insights = await generateTextToText(prompt);
    return insights;
  } catch (error) {
    console.error("Error generating meal timing insights:", error);
    return "Your meal timing appears consistent. Consider spacing meals 3-4 hours apart to maintain stable energy levels and blood sugar. Include a small protein-rich snack between lunch and dinner if that gap exceeds 5 hours.";
  }
}

/**
 * Provides personalized nutrition recommendations based on health goals
 */
export async function generateNutritionRecommendations(
  userData: { healthMetrics?: any, healthGoals?: string[] },
  nutritionData: INutritionData
): Promise<string[]> {
  const bmi = userData.healthMetrics?.weight && userData.healthMetrics?.height 
    ? userData.healthMetrics.weight / ((userData.healthMetrics.height/100) * (userData.healthMetrics.height/100))
    : null;
  
  const prompt = `
As a nutrition expert, provide 4 specific, actionable nutrition recommendations for this user:

Health Metrics:
${userData.healthMetrics ? `
- Age: ${userData.healthMetrics.age || 'Unknown'} years
- Gender: ${userData.healthMetrics.gender || 'Unknown'}
- BMI: ${bmi ? bmi.toFixed(1) : 'Unknown'}
- Activity Level: ${userData.healthMetrics.activityLevel || 'Unknown'}
` : '- No health metrics available'}

Health Goals: ${userData.healthGoals?.join(', ') || 'Not specified'}

Current Nutrition:
- Daily Calories: ${nutritionData.calories}
- Protein: ${nutritionData.protein_g}g
- Carbs: ${nutritionData.carbs_g}g
- Fats: ${nutritionData.fats_g}g

Provide EXACTLY 4 concise, specific nutrition recommendations as a JSON array of strings:
[
  "First recommendation",
  "Second recommendation",
  "Third recommendation",
  "Fourth recommendation"
]

Each recommendation should be 15-20 words maximum. Your response should include ONLY the JSON array with no additional text or explanation.
`;

  try {
    const result = await generateTextToText(prompt);
    
    // Extract JSON from the response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response");
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);
    return recommendations.slice(0, 4); // Ensure we get max 4 recommendations
  } catch (error) {
    console.error("Error generating nutrition recommendations:", error);
    
    // Default recommendations if there's an error
    return [
      "Increase protein intake to 0.8-1g per pound of bodyweight for muscle maintenance.",
      "Incorporate more fiber-rich vegetables to improve digestion and nutrient absorption.",
      "Stay hydrated with 2-3 liters of water daily to support metabolism.",
      "Choose complex carbs like whole grains over refined sources for sustained energy."
    ];
  }
}
