import { NextRequest, NextResponse } from "next/server";
import { generateExerciseImage } from "@/lib/generative-ai";
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
        
        // Get exercise names from request body
        const { exerciseNames } = await request.json();
        
        if (!exerciseNames || !Array.isArray(exerciseNames) || exerciseNames.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid exercise names" },
                { status: 400 }
            );
        }
        
        // Limit the number of exercises to process (to prevent abuse)
        const namesToProcess = exerciseNames.slice(0, 5);
        
        // Generate images for exercises
        const results = await Promise.all(namesToProcess.map(async (exerciseName) => {
            try {
                const prompt = `A clear, detailed illustration of a person performing the ${exerciseName} exercise with proper form.`;
                const imageUrl = await generateExerciseImage(prompt, exerciseName);
                
                return {
                    name: exerciseName,
                    imageUrl,
                    success: true
                };
            } catch (error) {
                console.error(`Error generating image for ${exerciseName}:`, error);
                return {
                    name: exerciseName,
                    success: false,
                    error: "Failed to generate image"
                };
            }
        }));
        
        // Create a map of successful results
        const imageMap = results.reduce((map, result) => {
            if (result.success && result.imageUrl) {
                map[result.name] = result.imageUrl;
            }
            return map;
        }, {} as Record<string, string>);
        
        return NextResponse.json({
            success: true,
            images: imageMap
        });
    } catch (error) {
        console.error("Error generating exercise images:", error);
        return NextResponse.json(
            { error: "Failed to generate exercise images" },
            { status: 500 }
        );
    }
}
