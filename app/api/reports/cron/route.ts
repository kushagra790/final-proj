import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import HealthReport from '@/models/HealthReport';
import { 
  generateHealthScore, 
  generateHealthSummary, 
  generateHealthPredictions,
  generateHistoricalTrends 
} from '@/lib/report-generator';
import { generatePdfReport } from '@/lib/pdf-generator';
import { startOfDay, subDays, subMonths } from 'date-fns';

// This endpoint is meant to be called by a cron job to generate
// monthly or weekly reports for all users
export async function POST(request: NextRequest) {
  try {
    // Verify API key for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { type = 'monthly' } = await request.json();
    
    // Determine cutoff date for last report
    const cutoffDate = type === 'weekly' ? subDays(new Date(), 7) : subMonths(new Date(), 1);
    
    // Find users who need a new report
    const users = await User.find({});
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Check if user already has a recent report
        const existingReport = await HealthReport.findOne({
          userId: user._id,
          generatedAt: { $gte: cutoffDate }
        });
        
        if (existingReport) {
          continue; // Skip if user already has a report
        }
        
        // Since this is a background job, we'll need to aggregate
        // the data directly here rather than relying on the front-end API
        
        // TODO: Implement background data collection for the report
        // This would be similar to the logic in the reports API route
        
        // For now, we'll just create a placeholder to demonstrate the concept
        const reportData = {
          userId: user._id,
          title: `${type === 'weekly' ? 'Weekly' : 'Monthly'} Health Report`,
          summary: "This is an automatically generated health report based on your recent activity.",
          healthScore: 75, // placeholder
          generatedAt: new Date()
        };
        
        // Save the report
        await HealthReport.create(reportData);
        successCount++;
      } catch (error) {
        console.error(`Error generating report for user ${user._id}:`, error);
        errorCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} reports, with ${errorCount} errors`,
      type
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Failed to run report generation job' },
      { status: 500 }
    );
  }
}
