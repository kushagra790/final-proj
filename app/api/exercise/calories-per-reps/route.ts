import { NextRequest, NextResponse } from "next/server";
import { generateTextToText } from "@/lib/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the exercise name from the request body
        const { exerciseName } = await request.json();

        if (!exerciseName) {
            return NextResponse.json(
                { error: "Exercise name is required" },
                { status: 400 }
            );
        }

        // Generate calories per rep estimation using AI
        const prompt = `Estimate the calories burned per repetition for the exercise: ${exerciseName}. 
        Provide only a numeric value between 0.1 and 2.0. For context, a push-up burns about 0.5 calories per rep, 
        and a burpee burns about 1.0 calories per rep.`;
        
        const result = await generateTextToText(prompt);
        
        // Extract the numeric value from the response
        const caloriesPerRep = parseFloat(result.replace(/[^\d.]/g, ''));
        
        // Validate the result
        if (isNaN(caloriesPerRep) || caloriesPerRep < 0.1 || caloriesPerRep > 2.0) {
            // Provide a reasonable default if the AI output is invalid
            return NextResponse.json({
                success: true,
                caloriesPerRep: 0.5,
                note: "Used default value due to invalid AI response"
            });
        }

        return NextResponse.json({
            success: true,
            caloriesPerRep
        });
    } catch (error) {
        console.error("Error estimating calories per rep:", error);
        return NextResponse.json(
            { error: "Failed to estimate calories per rep", caloriesPerRep: 0.5 },
            { status: 500 }
        );
    }
}
