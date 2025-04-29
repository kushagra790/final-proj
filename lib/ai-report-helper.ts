'use server';

import { generateTextToText } from './ai-service';
import { parseJSON } from 'date-fns';

export interface AvailableHealthData {
  user?: any;
  healthMetrics?: any;
  recentFoodEntries?: any[];
  recentExercises?: any[];
  recentSleep?: any[];
  report?: any;
}

export async function generateVitalSignsWithAI(healthData: AvailableHealthData) {
  try {
    const bloodPressure = healthData.healthMetrics?.bloodPressure || '120/80';
    const heartRate = healthData.healthMetrics?.heartRate || 72;
    
    // Generate 7 days of blood pressure data
    const bpData = [];
    const hrData = [];
    
    for (let i = 0; i < 7; i++) {
      // Generate plausible variations for systolic and diastolic
      const [systolic, diastolic] = bloodPressure.split('/').map(Number);
      const systolicVar = systolic + Math.floor(Math.random() * 10) - 5;
      const diastolicVar = diastolic + Math.floor(Math.random() * 8) - 4;
      
      bpData.push(`${systolicVar}/${diastolicVar}`);
      
      // Generate plausible variations for heart rate
      const hrVar = heartRate + Math.floor(Math.random() * 8) - 4;
      hrData.push(hrVar);
    }
    
    const prompt = `
      As a medical AI, generate a realistic vital signs report based on these health metrics:
      - Blood Pressure: ${bloodPressure}
      - Heart Rate: ${heartRate} bpm
      - Age: ${healthData.healthMetrics?.age || 'unknown'}
      - Gender: ${healthData.healthMetrics?.gender || 'unknown'}

      Return the data in this JSON format only, no explanations:
      {
        "bloodPressure": {
          "current": "${bloodPressure}",
          "trend": "stable", // one of: "improving", "worsening", "stable", "fluctuating"
          "lastMeasured": "today",
          "chartData": ${JSON.stringify(bpData)}
        },
        "heartRate": {
          "current": ${heartRate},
          "trend": "stable", // one of: "improving", "worsening", "stable", "fluctuating"
          "lastMeasured": "today",
          "chartData": ${JSON.stringify(hrData)}
        },
        "temperature": {
          "current": "98.6°F",
          "trend": "stable",
          "lastMeasured": "today"
        },
        "respiratoryRate": {
          "current": "16 bpm",
          "trend": "stable",
          "lastMeasured": "today"
        }
      }
    `;

    const aiResponse = await generateTextToText(prompt);
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('Error generating vital signs with AI:', error);
    
    // Return fallback data
    return {
      bloodPressure: {
        current: healthData.healthMetrics?.bloodPressure || '120/80',
        trend: "stable",
        lastMeasured: "today",
        chartData: ["118/78", "121/79", "120/80", "122/81", "119/78", "120/82", "121/80"]
      },
      heartRate: {
        current: healthData.healthMetrics?.heartRate || 72,
        trend: "stable",
        lastMeasured: "today",
        chartData: [70, 72, 74, 71, 73, 72, 70]
      },
      temperature: {
        current: "98.6°F",
        trend: "stable",
        lastMeasured: "today"
      },
      respiratoryRate: {
        current: "16 bpm",
        trend: "stable",
        lastMeasured: "today"
      }
    };
  }
}

export async function generateNutritionAdviceWithAI(healthData: AvailableHealthData, healthScore: number) {
  try {
    const weight = healthData.healthMetrics?.weight || 70;
    const height = healthData.healthMetrics?.height || 170;
    const age = healthData.healthMetrics?.age || 30;
    const gender = healthData.healthMetrics?.gender || 'unknown';
    const activityLevel = healthData.healthMetrics?.activityLevel || 'moderate';
    
    // Calculate average nutrition data if available
    let avgCalories = 0;
    let avgProtein = 0;
    let avgCarbs = 0;
    let avgFats = 0;
    
    if (healthData.recentFoodEntries && healthData.recentFoodEntries.length > 0) {
      const totalEntries = healthData.recentFoodEntries.length;
      const totals = healthData.recentFoodEntries.reduce((acc, entry) => {
        acc.calories += entry.calories || 0;
        acc.protein += entry.protein || 0;
        acc.carbs += entry.carbs || 0;
        acc.fats += entry.fats || 0;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
      
      avgCalories = Math.round(totals.calories / totalEntries);
      avgProtein = Math.round(totals.protein / totalEntries);
      avgCarbs = Math.round(totals.carbs / totalEntries);
      avgFats = Math.round(totals.fats / totalEntries);
    }
    
    // Fitness goals
    const fitnessGoals = healthData.healthMetrics?.fitnessGoals || [];
    
    const prompt = `
      As a nutrition expert AI, analyze the following user data and provide personalized nutrition targets and advice:
      
      User Profile:
      - Weight: ${weight} kg
      - Height: ${height} cm
      - Age: ${age}
      - Gender: ${gender}
      - Activity Level: ${activityLevel}
      - Health Score: ${healthScore}/100
      - Fitness Goals: ${fitnessGoals.join(', ') || 'General health improvement'}
      
      ${healthData.recentFoodEntries && healthData.recentFoodEntries.length > 0 ? `
      Current Nutrition (Average):
      - Average Calorie Intake: ${avgCalories} kcal
      - Average Protein: ${avgProtein}g
      - Average Carbs: ${avgCarbs}g
      - Average Fats: ${avgFats}g
      ` : ''}

      Based on scientific guidelines and the user's profile, provide:
      1. Daily calorie target
      2. Daily protein target (in grams)
      3. Daily carbs target (in grams)
      4. Daily fats target (in grams)
      5. 3-5 nutritional recommendations specific to this user
      
      Return the data in this JSON format:
      {
        "calorieTarget": 0,
        "proteinTarget": 0,
        "carbsTarget": 0,
        "fatsTarget": 0,
        "recommendations": []
      }
    `;

    const aiResponse = await generateTextToText(prompt);
    
    try {
      // Parse JSON response
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI nutrition advice:', error);
      
      // Calculate fallback targets based on basic formulas
      // Harris-Benedict equation (simplified)
      let bmr = 0;
      if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
      
      // Activity multiplier
      let activityMultiplier = 1.2; // Sedentary
      switch(activityLevel) {
        case 'light': activityMultiplier = 1.375; break;
        case 'moderate': activityMultiplier = 1.55; break;
        case 'active': activityMultiplier = 1.725; break;
        case 'very-active': activityMultiplier = 1.9; break;
      }
      
      const calorieTarget = Math.round(bmr * activityMultiplier);
      
      return {
        calorieTarget: calorieTarget,
        proteinTarget: Math.round(weight * 1.6), // 1.6g per kg of body weight
        carbsTarget: Math.round(calorieTarget * 0.45 / 4), // 45% of calories from carbs
        fatsTarget: Math.round(calorieTarget * 0.3 / 9), // 30% of calories from fats
        recommendations: [
          "Consider increasing your protein intake to support muscle maintenance.",
          "Try to include more fruits and vegetables in your diet for essential vitamins.",
          "Stay hydrated by drinking at least 2 liters of water daily.",
          "Monitor your portion sizes to maintain a healthy calorie balance.",
          "Include sources of healthy fats like avocados, nuts and olive oil."
        ]
      };
    }
  } catch (error) {
    console.error('Error generating nutrition advice with AI:', error);
    
    // Return fallback calculation
    const weight = healthData.healthMetrics?.weight || 70;
    const height = healthData.healthMetrics?.height || 170;
    const age = healthData.healthMetrics?.age || 30;
    const gender = healthData.healthMetrics?.gender || 'unknown';
    
    // Basic BMR calculation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    const calorieTarget = Math.round(bmr * 1.55); // Moderate activity
    
    return {
      calorieTarget: calorieTarget,
      proteinTarget: Math.round(weight * 1.6),
      carbsTarget: Math.round(calorieTarget * 0.45 / 4),
      fatsTarget: Math.round(calorieTarget * 0.3 / 9),
      recommendations: [
        "Consider increasing your protein intake to support muscle maintenance.",
        "Try to include more fruits and vegetables in your diet for essential vitamins.",
        "Stay hydrated by drinking at least 2 liters of water daily.",
        "Monitor your portion sizes to maintain a healthy calorie balance.",
        "Include sources of healthy fats like avocados, nuts and olive oil."
      ]
    };
  }
}

export async function generateHealthPredictionsWithAI(healthData: AvailableHealthData, healthScore: number) {
  try {
    const weight = healthData.healthMetrics?.weight || 0;
    const height = healthData.healthMetrics?.height || 0;
    const age = healthData.healthMetrics?.age || 0;
    const gender = healthData.healthMetrics?.gender || '';
    const bloodPressure = healthData.healthMetrics?.bloodPressure || '';
    const heartRate = healthData.healthMetrics?.heartRate || 0;
    const smokingStatus = healthData.healthMetrics?.smokingStatus || '';
    const chronicConditions = healthData.healthMetrics?.chronicConditions || '';
    const familyHistory = healthData.healthMetrics?.familyHistory || '';
    
    // Calculate BMI if not provided
    const bmi = healthData.healthMetrics?.bmi || (weight && height ? 
      Math.round((weight / Math.pow(height/100, 2)) * 10) / 10 : 'unknown');
    
    const prompt = `
      As a predictive health AI, analyze the following health data and provide personalized health predictions:
      
      User Profile:
      - Age: ${age}
      - Gender: ${gender}
      - Weight: ${weight} kg
      - Height: ${height} cm
      - BMI: ${bmi}
      - Blood Pressure: ${bloodPressure}
      - Heart Rate: ${heartRate} bpm
      - Smoking Status: ${smokingStatus}
      - Chronic Conditions: ${chronicConditions}
      - Family Medical History: ${familyHistory}
      - Health Score: ${healthScore}/100
      
      Create 3-4 personalized health predictions that are:
      1. Evidence-based and realistic
      2. Not alarmist but informative
      3. Focused on preventive care and positive outcomes
      4. Include both short-term (weeks to months) and long-term (years) timeframes
      
      Return the data as an array of prediction objects in this JSON format:
      [
        {
          "title": "Prediction Title",
          "prediction": "Detailed prediction description",
          "recommendation": "Related recommendation",
          "timeframe": "Short-term or Long-term"
        }
      ]
    `;

    const aiResponse = await generateTextToText(prompt);
    
    try {
      // Parse JSON response
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error parsing AI health predictions:', error);
      
      // Fallback predictions
      return [
        {
          title: "Cardiovascular Health",
          prediction: "If current trends continue, your cardiovascular fitness will likely improve over the next 3-6 months.",
          recommendation: "Consider adding 30 minutes of moderate cardio exercise 3-4 times per week to further enhance heart health.",
          timeframe: "Short-term"
        },
        {
          title: "Metabolic Health",
          prediction: "Your current health metrics suggest a lower risk for metabolic disorders if healthy habits are maintained.",
          recommendation: "Continue to monitor your blood sugar levels and maintain a balanced diet rich in whole foods.",
          timeframe: "Long-term"
        },
        {
          title: "Physical Fitness",
          prediction: "Maintaining your current activity level could help prevent age-related muscle loss and maintain mobility.",
          recommendation: "Add strength training 2-3 times per week to build muscle mass and improve bone density.",
          timeframe: "Long-term"
        }
      ];
    }
  } catch (error) {
    console.error('Error generating health predictions with AI:', error);
    
    // Return fallback predictions
    return [
      {
        title: "Cardiovascular Health",
        prediction: "If current trends continue, your cardiovascular fitness will likely improve over the next 3-6 months.",
        recommendation: "Consider adding 30 minutes of moderate cardio exercise 3-4 times per week to further enhance heart health.",
        timeframe: "Short-term"
      },
      {
        title: "Metabolic Health",
        prediction: "Your current health metrics suggest a lower risk for metabolic disorders if healthy habits are maintained.",
        recommendation: "Continue to monitor your blood sugar levels and maintain a balanced diet rich in whole foods.",
        timeframe: "Long-term"
      },
      {
        title: "Physical Fitness",
        prediction: "Maintaining your current activity level could help prevent age-related muscle loss and maintain mobility.",
        recommendation: "Add strength training 2-3 times per week to build muscle mass and improve bone density.",
        timeframe: "Long-term"
      },
      {
        title: "General Wellness",
        prediction: "Your health score indicates good overall health with room for improvement in specific areas.",
        recommendation: "Schedule regular check-ups to monitor your health progress and make adjustments as needed.",
        timeframe: "Short-term"
      }
    ];
  }
}

export async function generateHealthRecommendationsWithAI(healthData: AvailableHealthData) {
  try {
    const prompt = `
      As a health recommendations AI, provide 3-5 personalized health recommendations based on these metrics:
      - Blood Pressure: ${healthData.healthMetrics?.bloodPressure || 'unknown'}
      - Heart Rate: ${healthData.healthMetrics?.heartRate || 'unknown'} bpm
      - Weight: ${healthData.healthMetrics?.weight || 'unknown'} kg
      - Height: ${healthData.healthMetrics?.height || 'unknown'} cm
      - Age: ${healthData.healthMetrics?.age || 'unknown'}
      - Gender: ${healthData.healthMetrics?.gender || 'unknown'}

      Be specific, actionable, and practical. Focus on sustainable health improvements.
      Return ONLY an array of recommendation strings, no explanations or other text - just the JSON array:
    `;

    const aiResponse = await generateTextToText(prompt);
    
    try {
      // Attempt to parse the response as JSON
      return JSON.parse(aiResponse);
    } catch (error) {
      // If parsing fails, extract recommendation points with regex
      const recommendations = aiResponse
        .split(/[\n\r]+/)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
      
      return recommendations.length > 0 ? recommendations : [
        "Incorporate 30 minutes of moderate exercise most days of the week.",
        "Practice stress reduction techniques like meditation or deep breathing for 10 minutes daily.",
        "Ensure you get 7-8 hours of quality sleep each night.",
        "Stay hydrated by drinking water throughout the day."
      ];
    }
  } catch (error) {
    console.error('Error generating health recommendations with AI:', error);
    
    // Return fallback recommendations
    return [
      "Incorporate 30 minutes of moderate exercise most days of the week.",
      "Practice stress reduction techniques like meditation or deep breathing for 10 minutes daily.",
      "Ensure you get 7-8 hours of quality sleep each night.",
      "Stay hydrated by drinking water throughout the day.",
      "Schedule regular health check-ups to monitor your progress."
    ];
  }
}
