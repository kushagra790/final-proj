import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HealthReport from '@/models/HealthReport';
import User from '@/models/User';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email a health report to the user or a specified recipient
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { reportId, recipientEmail } = await request.json();
    
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find the report
    const report = await HealthReport.findOne({
      _id: reportId,
      userId: session.user.id
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Get user info
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Determine email recipient
    const emailTo = recipientEmail || user.email;
    
    if (!emailTo) {
      return NextResponse.json({ error: 'No email address available' }, { status: 400 });
    }
    
    // Format date for display
    const reportDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Generate shareable link
    const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL}/shared-report/${report._id}`;
    
    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: 'WellTrack <reports@welltrack.app>',
      to: [emailTo],
      subject: `Health Report - ${reportDate}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">WellTrack Health Report</h1>
          <p><strong>Date:</strong> ${reportDate}</p>
          <p><strong>Health Score:</strong> ${report.healthScore}/100</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <h2 style="color: #4b5563;">Summary</h2>
          <p>${report.summary}</p>
          
          <h2 style="color: #4b5563;">Key Metrics</h2>
          <ul>
            <li><strong>BMI:</strong> ${report.bmi || 'Not available'}</li>
            <li><strong>Activity Level:</strong> ${report.activityLevel || 'Not available'}</li>
            <li><strong>Risk Level:</strong> ${report.riskLevel || 'Not available'}</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${shareableLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Full Report</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            This is an automatically generated email from WellTrack. Please do not reply to this email.
          </p>
        </div>
      `,
    });
    
    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      messageId: data?.id,
      to: emailTo
    });
  } catch (error) {
    console.error('Error sending report email:', error);
    return NextResponse.json(
      { error: 'Failed to send report email' },
      { status: 500 }
    );
  }
}
