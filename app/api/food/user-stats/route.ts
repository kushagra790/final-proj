import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FoodEntry from '@/models/FoodEntry';
import UserFoodHistory from '@/models/UserFoodHistory';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    await dbConnect();
    
    // Calculate a variety of user statistics
    
    // 1. Get total entries count
    const totalEntries = await FoodEntry.countDocuments({ userId });
    
    // 2. Get average daily calories for the past month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyHistory = await UserFoodHistory.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 }).lean();
    
    // Calculate averages
    const averages = {
      dailyCalories: 0,
      dailyProtein: 0,
      dailyCarbs: 0,
      dailyFats: 0
    };
    
    if (monthlyHistory.length > 0) {
      const totals = monthlyHistory.reduce((acc, day) => {
        acc.calories += day.totalCalories;
        acc.protein += day.totalProtein;
        acc.carbs += day.totalCarbs;
        acc.fats += day.totalFats;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
      
      averages.dailyCalories = Math.round(totals.calories / monthlyHistory.length);
      averages.dailyProtein = Math.round(totals.protein / monthlyHistory.length);
      averages.dailyCarbs = Math.round(totals.carbs / monthlyHistory.length);
      averages.dailyFats = Math.round(totals.fats / monthlyHistory.length);
    }
    
    // 3. Get most commonly logged foods (top 5)
    const topFoods = await FoodEntry.aggregate([
      { $match: { userId } },
      { $group: { 
        _id: '$food_name', 
        count: { $sum: 1 },
        avgCalories: { $avg: '$calories' } 
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // 4. Get day with highest calorie intake
    const highestCalorieDay = await UserFoodHistory.findOne({ userId })
      .sort({ totalCalories: -1 })
      .lean();
    
    // 5. Get day with lowest calorie intake (excluding days with 0)
    const lowestCalorieDay = await UserFoodHistory.findOne({
      userId,
      totalCalories: { $gt: 0 }
    })
      .sort({ totalCalories: 1 })
      .lean();
    
    // 6. Get streaks (consecutive days with food entries)
    const allHistoryDates = await UserFoodHistory.find(
      { userId, entryCount: { $gt: 0 } },
      { date: 1 }
    ).sort({ date: 1 }).lean();
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (allHistoryDates.length > 0) {
      // Calculate current streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let checkDate = new Date(today);
      currentStreak = 0;
      
      // Go backwards from today to find consecutive days
      while (true) {
        const dateExists = allHistoryDates.some(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === checkDate.getTime();
        });
        
        if (dateExists) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Calculate longest streak
      longestStreak = 1;
      let tempStreak = 1;
      
      for (let i = 1; i < allHistoryDates.length; i++) {
        const prevDate = new Date(allHistoryDates[i-1].date);
        const currDate = new Date(allHistoryDates[i].date);
        
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
    }
    
    return NextResponse.json({
      totalEntries,
      averages,
      topFoods: topFoods.map(food => ({
        name: food._id,
        count: food.count,
        avgCalories: Math.round(food.avgCalories)
      })),
      highestCalorieDay: highestCalorieDay && 'date' in highestCalorieDay ? {
        date: highestCalorieDay.date,
        calories: highestCalorieDay.totalCalories
      } : null,
      lowestCalorieDay: lowestCalorieDay && 'date' in lowestCalorieDay ? {
        date: lowestCalorieDay.date,
        calories: lowestCalorieDay.totalCalories
      } : null,
      currentStreak,
      longestStreak
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 });
  }
}
