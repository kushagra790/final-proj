import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import HealthMetrics from "@/models/HealthMetrics";
import UserProfile from "@/models/UserProfile";
import User from "@/models/User";
import Vaccination from "@/models/Vaccination";
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user data
    const user = await User.findById(session.user.id).select('name email');
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    // Get health metrics data
    const healthMetrics = await HealthMetrics.findOne(
      { userId: session.user.id },
      {},
      { sort: { recordedAt: -1 } }
    );
    
    // Get vaccination data
    const vaccinations = await Vaccination.find({ 
      userId: session.user.id 
    }).sort({ dateAdministered: -1 });

    if (!user || !healthMetrics) {
      return NextResponse.json({ 
        error: "Health card data is incomplete. Please complete your health profile." 
      }, { status: 404 });
    }

    return NextResponse.json({
      personalInfo: {
        fullName: user.name,
        dateOfBirth: healthMetrics.dateOfBirth,
        bloodType: healthMetrics.bloodType || "Unknown",
        email: user.email,
        phone: healthMetrics.phone || userProfile?.phone,
        emergencyContact: healthMetrics.emergencyContact,
        emergencyPhone: healthMetrics.emergencyPhone,
        gender: healthMetrics.gender,
        age: healthMetrics.age
      },
      medicalConditions: {
        allergies: healthMetrics.allergies || [],
        chronicConditions: healthMetrics.chronicConditions || [],
        medications: healthMetrics.medications || [],
        surgeries: healthMetrics.surgeries || []
      },
      vitalSigns: {
        bloodPressure: healthMetrics.bloodPressure,
        heartRate: healthMetrics.heartRate,
        height: healthMetrics.height,
        weight: healthMetrics.weight,
        temperature: healthMetrics.temperature,
        respiratoryRate: healthMetrics.respiratoryRate
      },
      vaccinations: vaccinations.map((vaccine: { name: any; dateAdministered: any; provider: any; type: any; notes: any; }) => ({
        name: vaccine.name,
        date: vaccine.dateAdministered,
        provider: vaccine.provider,
        type: vaccine.type,
        notes: vaccine.notes
      })),
      updatedAt: healthMetrics.recordedAt
    });
  } catch (error) {
    console.error("Error fetching health card data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve health card data" },
      { status: 500 }
    );
  }
}
