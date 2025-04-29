import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: userProfile._id,
      displayName: userProfile.displayName,
      email: userProfile.email,
      initialHealthDataSubmitted: userProfile.initialHealthDataSubmitted,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    await dbConnect();
    
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: data },
      { new: true }
    );
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: userProfile._id,
      displayName: userProfile.displayName,
      email: userProfile.email,
      initialHealthDataSubmitted: userProfile.initialHealthDataSubmitted,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find and delete the user profile
    const deletedProfile = await UserProfile.findOneAndDelete({ userId: session.user.id });
    
    if (!deletedProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Optionally delete the user account as well
    await User.findByIdAndDelete(session.user.id);
    
    return NextResponse.json({ message: 'User profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}