import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Currently using placeholder data
    // In a real implementation, this would fetch from a database
    const activityData = {
      steps: 6892,
      distance: 4.2,
      activeMinutes: 45,
      caloriesBurned: 384,
      
      // Hourly breakdown
      timeline: [
        { time: '06:00', steps: 200, activeMinutes: 5 },
        { time: '08:00', steps: 1200, activeMinutes: 15 },
        { time: '10:00', steps: 2000, activeMinutes: 10 },
        { time: '12:00', steps: 3500, activeMinutes: 20 },
        { time: '14:00', steps: 4200, activeMinutes: 15 },
        { time: '16:00', steps: 5300, activeMinutes: 25 },
        { time: '18:00', steps: 6200, activeMinutes: 30 },
        { time: '20:00', steps: 6800, activeMinutes: 15 },
        { time: '22:00', steps: 6900, activeMinutes: 5 },
      ]
    };
    
    return NextResponse.json(activityData);
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  }
}
