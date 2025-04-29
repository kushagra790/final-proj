import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { generateHealthRecommendationsWithAI } from '@/lib/ai-report-helper';
import { AvailableHealthData } from '@/lib/ai-report-helper';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    
    if (!data.healthMetrics) {
      return NextResponse.json(
        { error: "Health metrics data is required" }, 
        { status: 400 }
      );
    }

    // Prepare health data for AI recommendation generation
    const healthData: AvailableHealthData = {
      healthMetrics: data.healthMetrics
    };

    // Generate personalized recommendations using AI
    const recommendations = await generateHealthRecommendationsWithAI(healthData);

    return NextResponse.json({
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
