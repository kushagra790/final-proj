import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HealthReport from '@/models/HealthReport';
import mongoose from 'mongoose';

// Get a shared health report by ID (accessible without authentication)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }
    
    // Find the report - note that we're not checking userId since this is a shared report
    const report = await HealthReport.findById(params.id);
    
    if (!report) {
      return NextResponse.json({ error: 'Shared report not found' }, { status: 404 });
    }
    
    // Return a sanitized version with only the fields needed for shared view
    return NextResponse.json({
      title: report.title,
      summary: report.summary,
      healthScore: report.healthScore,
      bmi: report.bmi,
      activityLevel: report.activityLevel,
      riskLevel: report.riskLevel,
      predictions: report.predictions,
      nutritionTrends: report.nutritionTrends,
      activityTrends: report.activityTrends,
      vitalsTrends: report.vitalsTrends,
      generatedAt: report.generatedAt,
      // Don't include pdfUrl or userId for security
    });
  } catch (error) {
    console.error('Error fetching shared report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared report' },
      { status: 500 }
    );
  }
}
