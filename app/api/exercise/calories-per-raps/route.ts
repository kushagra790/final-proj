import { NextRequest, NextResponse } from 'next/server';
import { generateTextToText } from '@/lib/generative-ai';

export async function POST(req: NextRequest) {
    console.log("I am running...")
    try {
        const { exerciseName } = await req.json();

        if (!exerciseName) {
            return NextResponse.json(
                { error: 'Exercise name is required' },
                { status: 400 }
            );
        }
        console.log(exerciseName)

        // Create a prompt for the AI to estimate calories per rep
        const prompt = `Please calculate the estimated calories burned for 1 repetition of ${exerciseName} exercise. Return only a number representing the calories burned per single rep. Base your estimate on an average adult. If you can't provide an estimate, return "Unable to calculate".`;
        console.log(prompt)

        // Get response from AI
        const caloriesPerRepResponse = await generateTextToText(prompt);
        console.log(caloriesPerRepResponse)
        // Try to parse the response as a number
        let caloriesPerRep: number | string = parseFloat(caloriesPerRepResponse.trim());
        
        // If parsing fails, return the original text
        if (isNaN(caloriesPerRep)) {
            caloriesPerRep = caloriesPerRepResponse.trim() || "Unable to calculate";
        }

        return NextResponse.json({ 
            exercise: exerciseName,
            caloriesPerRep,
        });
    } catch (error) {
        console.error('Error calculating calories per rep:', error);
        return NextResponse.json(
            { error: 'Failed to calculate calories per rep' },
            { status: 500 }
        );
    }
}