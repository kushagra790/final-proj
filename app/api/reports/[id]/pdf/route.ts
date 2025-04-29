import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HealthReport from '@/models/HealthReport';
import mongoose from 'mongoose';
import { generateReportPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }
    
    // Get user ID from session (could be in id or sub property)
    const userId = session.user.id || (session.user as any).sub;
    
    if (!userId) {
      console.error('No user ID found in session:', session);
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }
    
    // Find the report
    const report = await HealthReport.findOne({
      _id: params.id,
      userId: userId
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Generate PDF
    const pdfBuffer = await generateReportPDF(report);
    
    // Return the PDF as a blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=WellTrack-Health-Report-${new Date(report.generatedAt).toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}
