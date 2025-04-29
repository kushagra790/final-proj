export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthMetricsHistory from "@/models/HealthMetricsHistory";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all historical health metrics for the user, sorted by date
    const historyData = await HealthMetricsHistory.find(
      { userId: session.user.id }
    ).sort({ recordedAt: -1 });

    return NextResponse.json(historyData);
  } catch (error) {
    console.error("Error fetching health metrics history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
