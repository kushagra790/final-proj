import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthReport from "@/models/HealthReport";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get report history for the user
    const reports = await HealthReport.find({ 
      userId: session.user.id 
    })
    .select('_id title summary generatedAt healthScore bmi riskLevel')
    .sort({ generatedAt: -1 })
    .limit(limit);
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching report history:", error);
    return NextResponse.json(
      { error: "Failed to fetch report history" },
      { status: 500 }
    );
  }
}
