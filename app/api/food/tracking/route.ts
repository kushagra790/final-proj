import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import FoodEntry from "@/models/FoodEntry";
import { startOfDay, subDays, startOfWeek, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // Default to today
    
    let startDate: Date;
    let endDate = new Date(); // Default to now
    
    // Determine the date range based on the period
    switch (period) {
      case 'today':
        startDate = startOfDay(new Date());
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(new Date(), 1));
        endDate = endOfDay(subDays(new Date(), 1));
        break;
      case 'week':
        startDate = startOfWeek(new Date());
        break;
      case 'days':
        const days = parseInt(searchParams.get('days') || '7');
        startDate = startOfDay(subDays(new Date(), days));
        break;
      default:
        startDate = startOfDay(new Date());
    }
    
    // Find food entries within the date range
    const entries = await FoodEntry.find({
      userId: session.user.id,
      recorded_at: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // If no entries found, return default values
    if (!entries || entries.length === 0) {
      return NextResponse.json({
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fats_g: 0,
        entries: []
      });
    }
    
    // Calculate totals
    const calories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    const protein = entries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0);
    const carbs = entries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0);
    const fats = entries.reduce((sum, entry) => sum + (entry.fats_g || 0), 0);
    
    return NextResponse.json({
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fats_g: fats,
      entries: entries.map(entry => ({
        id: entry._id,
        food_name: entry.food_name,
        calories: entry.calories,
        meal_type: entry.meal_type,
        recorded_at: entry.recorded_at
      }))
    });
  } catch (error) {
    console.error("Error fetching food tracking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch food tracking data" },
      { status: 500 }
    );
  }
}
