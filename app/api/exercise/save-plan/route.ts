import { NextRequest, NextResponse } from "next/server";
import ExercisePlan from "@/models/ExercisePlan";
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
        
        // Get plan data from request body
        const { plan, environment } = await request.json();
        
        if (!plan || !environment) {
            return NextResponse.json(
                { error: "Missing required data" },
                { status: 400 }
            );
        }
        
        console.log(`Saving ${environment} plan for user ${userId}`);
        
        // Check if there's an existing plan for this user and environment
        const existingPlan = await ExercisePlan.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            environment
        });
        
        let savedPlan;
        
        if (existingPlan) {
            console.log(`Updating existing ${environment} plan`);
            // Update existing plan
            existingPlan.plan = plan;
            existingPlan.updatedAt = new Date();
            savedPlan = await existingPlan.save();
        } else {
            console.log(`Creating new ${environment} plan`);
            // Create new plan
            savedPlan = await ExercisePlan.create({
                userId: new mongoose.Types.ObjectId(userId),
                plan,
                environment,
            });
        }
        
        return NextResponse.json({
            success: true,
            plan: {
                id: savedPlan._id.toString(),
                environment: savedPlan.environment,
                plan: savedPlan.plan,
                createdAt: savedPlan.createdAt,
                updatedAt: savedPlan.updatedAt
            }
        });
    } catch (error) {
        console.error("Error saving exercise plan:", error);
        return NextResponse.json(
            { error: "Failed to save exercise plan", details: error instanceof Error ? error.message : String(error) },
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
        
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }
        
        console.log("Fetching plans for user:", userId);
        
        // Prepare filter - set userId to ObjectId
        const filter = { userId: new mongoose.Types.ObjectId(userId) };
        
        // Get plans for this user
        const plans = await ExercisePlan.find(filter).sort({ updatedAt: -1 });
        console.log("Found plans:", plans.length);
        
        return NextResponse.json({
            success: true,
            plans: plans.map(plan => ({
                id: plan._id.toString(),
                environment: plan.environment,
                plan: plan.plan,
                createdAt: plan.createdAt,
                updatedAt: plan.updatedAt
            }))
        });
    } catch (error) {
        console.error("Error fetching exercise plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch exercise plans", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
