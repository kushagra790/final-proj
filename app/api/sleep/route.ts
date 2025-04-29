import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Sleep from '@/models/Sleep';
import connectToDatabase from '@/lib/mongodb';

// Get all sleep records for the current user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to last 30 records
    
    const sleepRecords = await Sleep.find({ 
      userId: session.user.id 
    })
    .sort({ date: -1 })
    .limit(limit);

    return NextResponse.json(sleepRecords);
  } catch (error) {
    console.error('Error fetching sleep records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sleep records' },
      { status: 500 }
    );
  }
}

// Create a new sleep record
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse JSON directly instead of getting text first
    const data = await request.json();

    // Validate required fields
    if (!data.date || !data.startTime || !data.endTime || !data.quality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate duration in minutes if not provided
    let duration = data.duration;
    if (!duration && data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    const sleepRecord = await Sleep.create({
      userId: session.user.id,
      date: data.date || new Date(),
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      quality: data.quality,
      notes: data.notes || '',
    });

    return NextResponse.json(sleepRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating sleep record:', error);
    return NextResponse.json(
      { error: 'Failed to create sleep record' },
      { status: 500 }
    );
  }
}
