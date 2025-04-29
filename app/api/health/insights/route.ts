export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthMetrics from "@/models/HealthMetrics";
import HealthMetricsHistory from "@/models/HealthMetricsHistory";
import { generateTextToText } from "@/lib/ai-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type") || "summary";
    
    await dbConnect();

    // Get the latest health metrics
    const healthMetrics = await HealthMetrics.findOne(
      { userId: session.user.id },
      {},
      { sort: { recordedAt: -1 } }
    );

    if (!healthMetrics) {
      return NextResponse.json({ error: "No health data found" }, { status: 404 });
    }

    // Get historical data for trends
    const historyData = await HealthMetricsHistory.find(
      { userId: session.user.id }
    ).sort({ recordedAt: -1 }).limit(10);

    // Format the data for the AI prompt
    const userData = {
      currentMetrics: {
        height: healthMetrics.height,
        weight: healthMetrics.weight,
        age: healthMetrics.age,
        gender: healthMetrics.gender,
        activityLevel: healthMetrics.activityLevel,
        bloodPressure: healthMetrics.bloodPressure,
        heartRate: healthMetrics.heartRate,
        respiratoryRate: healthMetrics.respiratoryRate,
        temperature: healthMetrics.temperature,
        sleepDuration: healthMetrics.sleepDuration,
        stressLevel: healthMetrics.stressLevel,
        chronicConditions: healthMetrics.chronicConditions || [],
        allergies: healthMetrics.allergies || [],
        medications: healthMetrics.medications || [],
        familyHistory: healthMetrics.familyHistory || [],
        surgeries: healthMetrics.surgeries || [],
        fitnessGoals: healthMetrics.fitnessGoals || [],
        smokingStatus: healthMetrics.smokingStatus,
        dietType: healthMetrics.dietType,
      },
      history: historyData.map(record => ({
        weight: record.weight,
        bloodPressure: record.bloodPressure,
        heartRate: record.heartRate,
        sleepDuration: record.sleepDuration,
        recordedAt: record.recordedAt
      }))
    };

    let prompt = "";
    
    if (type === "summary") {
      prompt = `
        You are a health assistant providing a concise health summary.
        Based on the following health data, provide a brief summary of the person's current health status.
        Focus on key metrics and their implications. Keep your response under 200 words and format it in markdown.
        
        User Health Data:
        ${JSON.stringify(userData, null, 2)}
      `;
    } else if (type === "predictions") {
      prompt = `
        You are a health assistant providing health predictions and recommendations.
        Based on the following health data, provide 3-5 specific predictions about potential health risks
        and actionable recommendations to improve health outcomes.
        Consider trends in the historical data if available. Format your response in markdown with bullet points.
        Keep your response under 300 words.
        
        User Health Data:
        ${JSON.stringify(userData, null, 2)}
      `;
    } else if (type === "lifestyle") {
      prompt = `
        You are a health assistant providing lifestyle recommendations.
        Based on the following health data, provide 3-5 specific lifestyle changes that could improve
        the person's overall health and wellbeing. Consider their current metrics, activity level,
        and health goals. Format your response in markdown with bullet points.
        Keep your response under 250 words.
        
        User Health Data:
        ${JSON.stringify(userData, null, 2)}
      `;
    }

    const aiResponse = await generateTextToText(prompt);
    
    return NextResponse.json({ insight: aiResponse });
  } catch (error) {
    console.error("Error generating health insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 