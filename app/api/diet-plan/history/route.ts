export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import DietPlan from "@/models/DietPlan";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get diet plan history (limited to last 10 plans)
    const dietPlans = await DietPlan.find(
      { userId: session.user.id },
      { 
        _id: 1,
        dailyCalories: 1,
        dietType: 1,
        goalWeight: 1,
        timeframe: 1, 
        createdAt: 1 
      },
      { 
        sort: { createdAt: -1 },
        limit: 10 
      }
    );

    return NextResponse.json(dietPlans);
  } catch (error) {
    console.error("Error fetching diet plan history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
