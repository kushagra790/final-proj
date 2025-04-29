import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Sleep from '@/models/Sleep';
import  connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import { startOfDay, subDays } from 'date-fns';

// Get sleep statistics for the current user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7'); // Default to last 7 days
    
    const startDate = startOfDay(subDays(new Date(), days));
    
    // Get all sleep records for the specified period
    const sleepRecords = await Sleep.find({ 
      userId: session.user.id,
      date: { $gte: startDate }
    }).sort({ date: -1 });
    
    // Calculate statistics
    let stats = {
      totalRecords: sleepRecords.length,
      averageDuration: 0,
      qualityBreakdown: {
        poor: 0,
        fair: 0,
        good: 0,
        excellent: 0
      },
      averageQuality: 'N/A',
      latestSleep: sleepRecords.length > 0 ? sleepRecords[0] : null,
      streak: 0
    };
    
    if (sleepRecords.length > 0) {
      // Calculate average duration
      const totalDuration = sleepRecords.reduce((sum, record) => sum + record.duration, 0);
      stats.averageDuration = Math.round(totalDuration / sleepRecords.length);
      
      // Calculate quality breakdown
      sleepRecords.forEach(record => {
        stats.qualityBreakdown[record.quality as keyof typeof stats.qualityBreakdown]++;
      });
      
      // Determine average quality
      const qualityMap = {
        poor: 1,
        fair: 2,
        good: 3,
        excellent: 4
      };
      
      const qualitySum = sleepRecords.reduce((sum, record) => {
        return sum + qualityMap[record.quality as keyof typeof qualityMap];
      }, 0);
      
      const avgQualityScore = qualitySum / sleepRecords.length;
      
      if (avgQualityScore >= 3.5) stats.averageQuality = 'Excellent';
      else if (avgQualityScore >= 2.5) stats.averageQuality = 'Good';
      else if (avgQualityScore >= 1.5) stats.averageQuality = 'Fair';
      else stats.averageQuality = 'Poor';
      
      // Calculate streak (simplified)
      stats.streak = Math.min(sleepRecords.length, days);
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching sleep statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sleep statistics' },
      { status: 500 }
    );
  }
}
