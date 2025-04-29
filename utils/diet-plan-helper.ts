/**
 * Calculate the percentage of macronutrients based on their caloric contribution
 */
export function calculateMacroPercentages(protein: number, carbs: number, fat: number) {
  const totalCaloriesFromMacros = (protein * 4) + (carbs * 4) + (fat * 9);
  
  if (totalCaloriesFromMacros === 0) return { protein: 0, carbs: 0, fat: 0 };
  
  return {
    protein: Math.round((protein * 4 / totalCaloriesFromMacros) * 100),
    carbs: Math.round((carbs * 4 / totalCaloriesFromMacros) * 100),
    fat: Math.round((fat * 9 / totalCaloriesFromMacros) * 100)
  };
}

/**
 * Calculate the daily calorie needs based on health metrics
 */
export function calculateDailyCalories(
  weight: number, 
  height: number, 
  age: number, 
  gender: string, 
  activityLevel: string, 
  goalType: 'maintain' | 'lose' | 'gain' = 'maintain'
): number {
  // Mifflin-St Jeor Equation for BMR
  let bmr = 0;
  if (gender.toLowerCase() === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }
  
  // Activity multiplier
  const activityMultiplier = getActivityMultiplier(activityLevel);
  
  // TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultiplier;
  
  // Adjust based on goal
  switch (goalType) {
    case 'lose':
      return Math.round(tdee - 500); // 500 calorie deficit for weight loss
    case 'gain':
      return Math.round(tdee + 300); // 300 calorie surplus for weight gain
    default:
      return Math.round(tdee); // Maintain weight
  }
}

/**
 * Get activity level multiplier
 */
export function getActivityMultiplier(activityLevel: string): number {
  switch (activityLevel.toLowerCase()) {
    case 'sedentary':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'active':
      return 1.725;
    case 'very active':
      return 1.9;
    default:
      return 1.55; // Default to moderate
  }
}

/**
 * Calculate the total daily nutrition from meals
 */
export function calculateDailyTotals(meals: any[]) {
  return meals.reduce((totals, meal) => {
    totals.calories += meal?.calories || 0;
    totals.protein += meal?.protein || 0;
    totals.carbs += meal?.carbs || 0;
    totals.fat += meal?.fat || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
