'use server';

import { generateTextToText } from './ai-service';
import PDFDocument from 'pdfkit';

/**
 * Generates a PDF report based on report data
 */
export async function generatePdfReport(reportData: any): Promise<Buffer> {
  // Create a buffer to store PDF data
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 50,
        size: 'A4'
      });
      
      // Store the PDF content in a buffer
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to the PDF
      
      // Header
      doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#3a86ff')
        .text('WellTrack Health Report', { align: 'center' });
        
      doc.moveDown();
      
      // Report date
      const reportDate = new Date(reportData.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#333')
        .text(`Generated on: ${reportDate}`, { align: 'center' });
        
      doc.moveDown(2);
      
      // Health Score
      doc.font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#333')
        .text('Health Score', { underline: true });
        
      doc.moveDown(0.5);
      
      // Add health score visualization
      const scoreY = doc.y;
      const scoreRadius = 40;
      doc.circle(80, scoreY + scoreRadius, scoreRadius)
         .lineWidth(3)
         .strokeColor('#e5e5e5')
         .stroke();
      
      // Score arc
      const scorePercentage = reportData.healthScore / 100;
      doc.circle(80, scoreY + scoreRadius, scoreRadius)
         .strokeColor(scorePercentage >= 0.8 ? '#10b981' : scorePercentage >= 0.6 ? '#f59e0b' : '#ef4444')
         .lineWidth(6)
         .stroke();
      
      // Score text
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor('#333')
         .text(`${reportData.healthScore}`, 80, scoreY + scoreRadius - 10, { align: 'center' });
      
      // Score label
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#666')
         .text(`out of 100`, 80, scoreY + scoreRadius + 10, { align: 'center' });
      
      // Summary text to the right of the score
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#333')
         .text(reportData.summary, 130, scoreY, {
           width: 350,
           align: 'left'
         });
      
      doc.moveDown(2);
      
      // Key health metrics
      doc.font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#333')
        .text('Key Health Metrics', { underline: true });
      
      doc.moveDown(0.5);
      
      const metrics = [
        { name: 'BMI', value: reportData.bmi || 'N/A' },
        { name: 'Activity Level', value: reportData.activityLevel || 'N/A' },
        { name: 'Risk Level', value: reportData.riskLevel || 'N/A' }
      ];
      
      metrics.forEach(metric => {
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#333')
           .text(`${metric.name}:`, { continued: true })
           .font('Helvetica')
           .text(` ${metric.value}`);
           
        doc.moveDown(0.5);
      });
      
      doc.moveDown();
      
      // Health predictions
      if (reportData.predictions && reportData.predictions.length > 0) {
        doc.font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#333')
          .text('Health Predictions', { underline: true });
          
        doc.moveDown(0.5);
        
        reportData.predictions.forEach((prediction: any, i: number) => {
          // Draw a light box around each prediction
          const boxY = doc.y;
          doc.rect(50, boxY, 500, 110)
             .fillColor('#f8fafc')
             .fill();
             
          // Reset position after filling
          doc.y = boxY + 10;
          
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .fillColor('#333')
             .text(prediction.title, 60);
             
          doc.moveDown(0.5);
          
          doc.font('Helvetica')
             .fontSize(12)
             .fillColor('#333')
             .text('Prediction: ', 60, undefined, { continued: true })
             .font('Helvetica')
             .text(prediction.prediction);
             
          doc.moveDown(0.5);
          
          doc.font('Helvetica')
             .fontSize(12)
             .fillColor('#333')
             .text('Recommendation: ', 60, undefined, { continued: true })
             .font('Helvetica')
             .text(prediction.recommendation);
             
          doc.moveDown(0.5);
          
          doc.font('Helvetica')
             .fontSize(10)
             .fillColor('#666')
             .text(`Timeframe: ${prediction.timeframe}`, 60);
             
          doc.moveDown(1.5);
        });
      }
      
      // Add page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#666')
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }
      
      // Finalize the PDF and end the stream
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
}

/**
 * Generates a PDF report from a HealthReport document
 * This is the function used by the API endpoint
 */
export async function generateReportPDF(report: any): Promise<Buffer> {
  return generatePdfReport(report);
}

// Keep this function for generating descriptions
export async function generateReportDescription(reportData: any): Promise<string> {
  const prompt = `
Create a brief, professional description for a health report PDF with the following details:

- Health Score: ${reportData.healthScore}/100
- Date Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}
- BMI: ${reportData.bmi || 'N/A'}
- Activity Level: ${reportData.activityLevel || 'N/A'}
- Risk Level: ${reportData.riskLevel || 'Low'}

Key areas covered in the report:
- Overall health assessment
- Vital signs monitoring
- Activity tracking
- Nutrition analysis
- Health predictions and recommendations

Write a formal description that would appear on the cover of this health report PDF.
Keep your response under 150 words.
`;

  try {
    const description = await generateTextToText(prompt);
    return description;
  } catch (error) {
    console.error("Error generating report description:", error);
    return "Comprehensive Health Status Report generated on " + 
      new Date(reportData.generatedAt).toLocaleDateString() + 
      ". This document provides an analysis of your current health metrics, including vital signs, activity patterns, and nutritional intake. It includes personalized recommendations and future health predictions based on your data trends.";
  }
}
