import { NextRequest, NextResponse } from "next/server";
import Exercise from "@/models/Exercise";
import dbConnect from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

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
    
    // Parse query parameters
    const url = new URL(request.url);
    const environment = url.searchParams.get('environment');
    const muscleGroup = url.searchParams.get('muscleGroup');
    const difficulty = url.searchParams.get('difficulty');
    
    // Build query
    const query: any = {};
    
    if (environment) {
      query.environment = environment;
    }
    
    if (muscleGroup) {
      query.muscleGroups = { $in: [muscleGroup] };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Fetch exercises
    const exercises = await Exercise.find(query).sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      exercises: exercises.map(exercise => ({
        id: exercise._id,
        name: exercise.name,
        description: exercise.description,
        muscleGroups: exercise.muscleGroups,
        environment: exercise.environment,
        difficulty: exercise.difficulty,
        equipment: exercise.equipment,
        formTips: exercise.formTips,
        imageUrl: exercise.imageUrl,
        category: exercise.category
      }))
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}
