import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FoodEntry from '@/models/FoodEntry';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today'; // today, week, month, year
  
  try {
    // Get user ID from auth session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    await dbConnect();
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'today':
      default:
        startDate.setHours(0, 0, 0, 0); // Beginning of today
    }
    
    // Query for food entries in the given period
    const entries = await FoodEntry.find({
      userId: userId,
      recorded_at: {
        $gte: startDate,
        $lte: now
      }
    }).lean();
    
    // Calculate summary statistics
    const summary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      entryCount: entries.length,
      period: period,
      dailyAvgCalories: 0,
      dailyAvgProtein: 0,
      dailyAvgCarbs: 0,
      dailyAvgFats: 0
    };
    
    // Sum up the nutritional data
    entries.forEach(entry => {
      summary.totalCalories += entry.calories;
      summary.totalProtein += entry.protein_g || 0;
      summary.totalCarbs += entry.carbs_g || 0;
      summary.totalFats += entry.fats_g || 0;
    });
    
    // Calculate daily averages if period is longer than a day
    if (period !== 'today') {
      const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      summary.dailyAvgCalories = summary.totalCalories / daysDiff;
      summary.dailyAvgProtein = summary.totalProtein / daysDiff;
      summary.dailyAvgCarbs = summary.totalCarbs / daysDiff;
      summary.dailyAvgFats = summary.totalFats / daysDiff;
    }
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch food summary' }, { status: 500 });
  }
}
