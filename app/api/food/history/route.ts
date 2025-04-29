import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FoodEntry from '@/models/FoodEntry';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const aggregateBy = searchParams.get('aggregateBy') || 'day'; // day, week, month
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    await dbConnect();
    
    // Required date range parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Both startDate and endDate are required' }, { status: 400 });
    }
    
    // Build date format for grouping based on aggregation level
    let dateFormat;
    switch(aggregateBy) {
      case 'week':
        dateFormat = '%Y-%U'; // Year-WeekNumber
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }
    
    // Create the aggregation pipeline
    const pipeline = [
      {
        $match: {
          userId: userId,
          recorded_at: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$recorded_at' } }
          },
          totalCalories: { $sum: '$calories' },
          totalProtein: { $sum: '$protein_g' },
          totalCarbs: { $sum: '$carbs_g' },
          totalFats: { $sum: '$fats_g' },
          entryCount: { $sum: 1 },
          entries: { $push: '$$ROOT' }
        }
      },
      {
        $sort: { "_id.date": 1 } // Sort by date ascending
      } as any
    ];
    
    const results = await FoodEntry.aggregate(pipeline);
    
    // Format the results for easier consumption by the client
    const formattedResults = results.map(result => ({
      date: result._id.date,
      totalCalories: result.totalCalories,
      totalProtein: result.totalProtein,
      totalCarbs: result.totalCarbs,
      totalFats: result.totalFats,
      entryCount: result.entryCount,
      // Optionally include individual entries if needed
      entries: result.entries.map((entry: any) => ({
        id: entry._id.toString(),
        food_name: entry.food_name,
        calories: entry.calories,
        protein_g: entry.protein_g,
        carbs_g: entry.carbs_g,
        fats_g: entry.fats_g,
        recorded_at: entry.recorded_at
      }))
    }));
    
    return NextResponse.json(formattedResults);
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch food history' }, { status: 500 });
  }
}
