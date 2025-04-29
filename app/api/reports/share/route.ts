import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HealthReport from '@/models/HealthReport';
import { generateReportDescription } from '@/lib/pdf-generator';

// Share a health report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { reportId, shareType } = body;
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    console.log("Sharing report:", reportId, "for user:", session.user.id);
    
    await dbConnect();
    
    // Find the report
    const report = await HealthReport.findOne({
      _id: reportId,
      userId: session.user.id
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Generate a description for the shared report
    const description = await generateReportDescription(report);
    
    // Generate the share link - use absolute URL with environment variable
    // This ensures it works regardless of the environment
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      // Fallback if environment variable is not set
      baseUrl = 'http://localhost:3000';
    }
    
    const shareLink = `${baseUrl}/shared-report/${reportId}`;
    
    // Return sharing info
    return NextResponse.json({
      success: true,
      shareLink,
      description,
      reportTitle: report.title,
      shareType
    });
  } catch (error) {
    console.error('Error sharing health report:', error);
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    );
  }
}
