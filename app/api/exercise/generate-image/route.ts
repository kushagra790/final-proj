import { NextRequest, NextResponse } from "next/server";
import { generateExerciseImage } from "@/lib/generative-ai";

export async function POST(request: NextRequest) {
    try {
        // Get the exercise name from the request body
        const { exerciseName } = await request.json();

        if (!exerciseName) {
            return NextResponse.json(
                { error: "Exercise name is required" },
                { status: 400 }
            );
        }

        // Generate an image based on the exercise name
        const imagePrompt = `A clear, detailed illustration of a person performing the exercise: ${exerciseName}. Show proper form and technique with a clean background.`;
        const imageUrl = await generateExerciseImage(imagePrompt,exerciseName);

        // Return the generated image URL and exercise name
        return NextResponse.json({
            success: true,
            imageUrl,
            exerciseName
        });
    } catch (error) {
        console.error("Error generating exercise image:", error);
        return NextResponse.json(
            { error: "Failed to generate exercise image" },
            { status: 500 }
        );
    }
}
