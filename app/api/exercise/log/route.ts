import { NextRequest, NextResponse } from "next/server";
import ExerciseLog from "@/models/ExerciseLog";
import dbConnect from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        
        // Check authentication
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // Get user ID from session
        const userId = session.user.id;
        
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }
        
        // Get exercise data from request body
        const { name, category, sets, reps, caloriesBurned, imageUrl } = await request.json();
        
        if (!name || !sets || !reps || !caloriesBurned) {
            return NextResponse.json(
                { error: "Missing required exercise data" },
                { status: 400 }
            );
        }
        
        // Create a new exercise log record
        const exerciseLog = await ExerciseLog.create({
            userId: new mongoose.Types.ObjectId(userId),
            name,
            category: category || "other",
            sets,
            reps, 
            caloriesBurned,
            imageUrl,
            date: new Date()
        });
        
        return NextResponse.json({
            success: true,
            exercise: {
                id: exerciseLog._id,
                name: exerciseLog.name,
                caloriesBurned: exerciseLog.caloriesBurned,
                date: exerciseLog.date
            }
        });
    } catch (error) {
        console.error("Error saving exercise log:", error);
        return NextResponse.json(
            { error: "Failed to save exercise log data" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        
        // Check authentication
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        
        // Get user ID from session
        const userId = session.user.id;
        
        // Get exercise logs for this user
        const exerciseLogs = await ExerciseLog.find({ userId: userId })
            .sort({ date: -1 })
            .limit(10);
        
        return NextResponse.json({
            success: true,
            logs: exerciseLogs.map(log => ({
                _id: log._id,
                name: log.name,
                category: log.category,
                sets: log.sets,
                reps: log.reps,
                caloriesBurned: log.caloriesBurned,
                date: log.date,
                imageUrl: log.imageUrl
            }))
        });
    } catch (error) {
        console.error("Error fetching exercise logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch exercise log data" },
            { status: 500 }
        );
    }
}
