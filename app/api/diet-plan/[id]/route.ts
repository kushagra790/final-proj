import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import DietPlan from "@/models/DietPlan";

// Get a specific diet plan
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const dietPlan = await DietPlan.findById(id);

    if (!dietPlan) {
      return NextResponse.json({ error: "Diet plan not found" }, { status: 404 });
    }

    // Check if the diet plan belongs to the authenticated user
    if (dietPlan.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(dietPlan);
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a diet plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const dietPlan = await DietPlan.findById(id);

    if (!dietPlan) {
      return NextResponse.json({ error: "Diet plan not found" }, { status: 404 });
    }

    // Check if the diet plan belongs to the authenticated user
    if (dietPlan.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await DietPlan.findByIdAndDelete(id);

    return NextResponse.json({ message: "Diet plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
