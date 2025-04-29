export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import DietPlan from "@/models/DietPlan";
import HealthMetrics from "@/models/HealthMetrics";
import FoodEntry from "@/models/FoodEntry";
import { 
  generateTextToTextServer, 
  generateTextToImageServer 
} from "@/lib/server-generative-ai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const isAutoGenerate = body.autoGenerate === true;
    
    // Get the user's health metrics
    const healthMetrics = await HealthMetrics.findOne(
      { userId: session.user.id },
      {},
      { sort: { recordedAt: -1 } }
    );

    if (!healthMetrics) {
      return NextResponse.json(
        { error: "Health metrics not found" },
        { status: 404 }
      );
    }

    // Calculate daily calories based on health metrics and goals
    const bmr = calculateBMR(
      healthMetrics.weight,
      healthMetrics.height,
      healthMetrics.age,
      healthMetrics.gender
    );
    
    const activityMultiplier = getActivityMultiplier(healthMetrics.activityLevel);
    const maintenanceCalories = Math.round(bmr * activityMultiplier);
    
    // Adjust calories based on goal (weight loss or gain)
    let calorieAdjustment = 0;
    if (body.goalWeight < healthMetrics.weight) {
      // For weight loss, create a deficit
      calorieAdjustment = -500;
    } else if (body.goalWeight > healthMetrics.weight) {
      // For weight gain, create a surplus
      calorieAdjustment = 300;
    }
    
    const dailyCalories = maintenanceCalories + calorieAdjustment;

    // If auto-generate is enabled, fetch additional user data to personalize the plan
    let userFoodPreferences = "";
    let dietInsights = "";
    
    if (isAutoGenerate) {
      try {
        // Get user's food history to determine preferences
        const foodEntries = await FoodEntry.find({ userId: session.user.id })
          .sort({ recorded_at: -1 })
          .limit(50);
          
        if (foodEntries && foodEntries.length > 0) {
          // Extract most common foods
          const foodCounts: Record<string, number> = {};
          foodEntries.forEach(entry => {
            if (foodCounts[entry.food_name]) {
              foodCounts[entry.food_name]++;
            } else {
              foodCounts[entry.food_name] = 1;
            }
          });
          
          // Get top 5 foods
          const topFoods = Object.entries(foodCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
            
          if (topFoods.length > 0) {
            userFoodPreferences = `Preferred foods based on history: ${topFoods.join(', ')}.`;
          }
        }
        
        // Calculate average macros if available
        if (foodEntries && foodEntries.length > 0) {
          const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0);
          const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0);
          const totalFats = foodEntries.reduce((sum, entry) => sum + (entry.fats_g || 0), 0);
          
          const avgProtein = Math.round(totalProtein / foodEntries.length);
          const avgCarbs = Math.round(totalCarbs / foodEntries.length);
          const avgFats = Math.round(totalFats / foodEntries.length);
          
          if (avgProtein > 0 || avgCarbs > 0 || avgFats > 0) {
            dietInsights = `Current average macros: ${avgProtein}g protein, ${avgCarbs}g carbs, ${avgFats}g fats per meal.`;
          }
        }
      } catch (error) {
        console.error("Error fetching user food preferences:", error);
        // Continue with basic plan generation even if preferences fetch fails
      }
    }

    // Generate a personalized diet plan using AI
    const prompt = `
      Create a detailed diet plan with the following specifications:
      - Total daily calories: ${dailyCalories} calories
      - Diet type: ${body.dietType}
      - Number of meals: ${body.mealCount}
      - Include snacks: ${body.includeSnacks ? 'Yes' : 'No'}
      - Health conditions: ${healthMetrics.chronicConditions || 'None'}
      - Allergies: ${healthMetrics.allergies || 'None'}
      ${userFoodPreferences ? `- ${userFoodPreferences}` : ''}
      ${dietInsights ? `- ${dietInsights}` : ''}
      
      For each meal, provide:
      1. Meal name
      2. Total calories
      3. Macronutrients (protein, carbs, fat in grams)
      4. 2-3 specific food items with portion sizes
      
      Format the response as a JSON object with the structure:
      {
        "meals": [
          {
            "name": "Meal name",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "foods": [
              {
                "name": "Food item name",
                "portion": "Portion description"
              }
            ]
          }
        ]
      }
      
      IMPORTANT: Your response must be a valid JSON object and nothing else. No explanations before or after the JSON.
    `;

    console.log("Sending prompt to AI service for diet plan generation");
    
    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Google Generative AI API key is not configured");
      return NextResponse.json(
        { error: "AI service configuration is missing" },
        { status: 500 }
      );
    }

    let aiResponse;
    try {
      aiResponse = await generateTextToTextServer(prompt);
      console.log("Received response from AI service");
    } catch (aiError) {
      console.error("Error calling AI service:", aiError);
      return NextResponse.json(
        { error: "Failed to generate diet plan with AI service" },
        { status: 500 }
      );
    }
    
    let dietPlanData;
    
    try {
      // Try to parse the AI response directly first
      try {
        dietPlanData = JSON.parse(aiResponse);
      } catch (directParseError) {
        // If direct parsing fails, try extracting JSON using regex
        console.log("Direct JSON parsing failed, trying to extract JSON with regex");
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : null;
        
        if (!jsonString) {
          console.error("No valid JSON found in AI response");
          console.log("AI response:", aiResponse);
          throw new Error("No valid JSON found in AI response");
        }
        
        dietPlanData = JSON.parse(jsonString);
      }
      
      // Validate that the response has the expected structure
      if (!dietPlanData.meals || !Array.isArray(dietPlanData.meals) || dietPlanData.meals.length === 0) {
        console.error("AI response does not contain meals array");
        console.log("AI response:", aiResponse);
        throw new Error("AI response has invalid format");
      }
      
      // Generate images for food items (limit to first item in each meal to save API calls)
      if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
        for (let meal of dietPlanData.meals) {
          if (meal.foods && meal.foods.length > 0) {
            const firstFood = meal.foods[0];
            try {
              const imagePrompt = `High-quality professional food photography of ${firstFood.name}, ${firstFood.portion}, on a clean plate with soft lighting, top-down view, healthy food, appetizing`;
              const imageUrl = await generateTextToImageServer(imagePrompt, firstFood.name);
              firstFood.imageUrl = imageUrl;
            } catch (imageError) {
              console.error(`Error generating image for ${firstFood.name}:`, imageError);
              // Continue without image if image generation fails
            }
          }
        }
      } else {
        console.log("Skipping image generation - API keys not configured");
      }
    } catch (parseError) {
      console.error("Error processing AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to process AI response for diet plan" },
        { status: 500 }
      );
    }

    // Save the diet plan to the database
    const dietPlan = new DietPlan({
      userId: session.user.id,
      dailyCalories,
      goalWeight: body.goalWeight || healthMetrics.weight, // Use either provided goal or current weight
      timeframe: body.timeframe,
      dietType: body.dietType,
      mealCount: body.mealCount,
      includeSnacks: body.includeSnacks,
      meals: dietPlanData.meals
    });

    await dietPlan.save();

    return NextResponse.json({
      message: "Diet plan created successfully",
      dietPlan: dietPlan
    });
  } catch (error) {
    console.error("Error creating diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the latest diet plan for the user
    const dietPlan = await DietPlan.findOne(
      { userId: session.user.id },
      {},
      { sort: { createdAt: -1 } }
    );

    if (!dietPlan) {
      return NextResponse.json(null);
    }

    return NextResponse.json(dietPlan);
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for calculations
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  if (gender.toLowerCase() === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
}

function getActivityMultiplier(activityLevel: string): number {
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
