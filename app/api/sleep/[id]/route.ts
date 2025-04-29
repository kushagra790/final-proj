import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Sleep from '@/models/Sleep';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

// Get a specific sleep record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const sleepRecord = await Sleep.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!sleepRecord) {
      return NextResponse.json({ error: 'Sleep record not found' }, { status: 404 });
    }

    return NextResponse.json(sleepRecord);
  } catch (error) {
    console.error('Error fetching sleep record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sleep record' },
      { status: 500 }
    );
  }
}

// Update a sleep record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();
    
    // Recalculate duration if times changed
    let duration = data.duration;
    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    const updatedSleepRecord = await Sleep.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { 
        ...data,
        duration,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedSleepRecord) {
      return NextResponse.json({ error: 'Sleep record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSleepRecord);
  } catch (error) {
    console.error('Error updating sleep record:', error);
    return NextResponse.json(
      { error: 'Failed to update sleep record' },
      { status: 500 }
    );
  }
}

// Delete a sleep record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deletedSleepRecord = await Sleep.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!deletedSleepRecord) {
      return NextResponse.json({ error: 'Sleep record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    return NextResponse.json(
      { error: 'Failed to delete sleep record' },
      { status: 500 }
    );
  }
}
