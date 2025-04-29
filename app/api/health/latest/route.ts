export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthMetrics from "@/models/HealthMetrics";
import UserProfile from "@/models/UserProfile";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the latest health metrics
    const healthMetrics = await HealthMetrics.findOne(
      { userId: session.user.id },
      {},
      { sort: { recordedAt: -1 } }
    ).populate('history');

    // Get profile to check history count
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!healthMetrics) {
      return NextResponse.json(null);
    }

    // Extract the count of history records
    const historyCount = userProfile?.metricsUpdateCount || 0;

    return NextResponse.json({
      userId: healthMetrics.userId,
      height: healthMetrics.height,
      weight: healthMetrics.weight,
      age: healthMetrics.age,
      gender: healthMetrics.gender,
      dateOfBirth: healthMetrics.dateOfBirth,
      email: healthMetrics.email,
      phone: healthMetrics.phone,
      emergencyContact: healthMetrics.emergencyContact,
      emergencyPhone: healthMetrics.emergencyPhone,
      activityLevel: healthMetrics.activityLevel,
      smokingStatus: healthMetrics.smokingStatus,
      dietType: healthMetrics.dietType,
      bloodPressure: healthMetrics.bloodPressure,
      heartRate: healthMetrics.heartRate,
      respiratoryRate: healthMetrics.respiratoryRate,
      temperature: healthMetrics.temperature,
      sleepDuration: healthMetrics.sleepDuration,
      stressLevel: healthMetrics.stressLevel,
      chronicConditions: healthMetrics.chronicConditions,
      allergies: healthMetrics.allergies,
      medications: healthMetrics.medications,
      familyHistory: healthMetrics.familyHistory,
      surgeries: healthMetrics.surgeries,
      fitnessGoals: healthMetrics.fitnessGoals,
      recordedAt: healthMetrics.recordedAt,
      history: healthMetrics.history,
      historyCount,
      hasHistoricalData: historyCount > 1
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
