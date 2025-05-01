import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import dbConnect from "@/lib/mongodb";
import FoodEntry from "@/models/FoodEntry";
import { storeImage } from '@/utils/uploadImage';
import { updateHistoryOnNewEntry } from '@/utils/updateDailyHistory';
import { generateTextAndImageToTextServer } from '@/lib/server-generative-ai';


// Validation schema for food entry
const foodEntrySchema = z.object({
  userId: z.string(),
  food_name: z.string().min(1),
  calories: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fats_g: z.number().nonnegative(),
  protein_percent: z.number().nonnegative().optional(),
  carbs_percent: z.number().nonnegative().optional(),
  fats_percent: z.number().nonnegative().optional(),
  image_url: z.string().optional(),
  ai_analysis_result: z.string().optional(),
});

// GET handler - fetch food entries
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    
    // Get food entries for the user
    const entries = await FoodEntry.find({ 
      userId: session.user.id 
    })
    .sort({ recorded_at: -1 })
    .limit(limit);
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching food entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch food entries" },
      { status: 500 }
    );
  }
}

// POST handler - create a new food entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    
    const data = await req.json();
    
    // Create a new food entry
    const newEntry = new FoodEntry({
      userId: session.user.id,
      food_name: data.food_name,
      calories: data.calories,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fats_g: data.fats_g,
      fiber_g: data.fiber_g,
      protein_percent: data.protein_percent,
      carbs_percent: data.carbs_percent,
      fats_percent: data.fats_percent,
      meal_type: data.meal_type || 'Snack',
      recorded_at: data.recorded_at || new Date(),
      image_url: data.image_url
    });
    
    await newEntry.save();
    
    return NextResponse.json(newEntry);
  } catch (error) {
    console.error("Error creating food entry:", error);
    return NextResponse.json(
      { error: "Failed to create food entry" },
      { status: 500 }
    );
  }
}
