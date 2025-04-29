import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data } = await req.json();

    if (type !== 'dietPlan' || !data) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    // Collect the data chunks
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Generate PDF content
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      doc.on('error', reject);

      // Title and header
      doc.fontSize(25).text('WellTrack - Personal Diet Plan', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Created on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      // Diet plan details
      doc.fontSize(16).text('Plan Overview:', { underline: true });
      doc.fontSize(12)
        .text(`Diet Type: ${data.dietType ? data.dietType.charAt(0).toUpperCase() + data.dietType.slice(1) : 'Personalized'}`)
        .text(`Daily Calories: ${data.dailyCalories} kcal`)
        .text(`Goal Weight: ${data.goalWeight} kg`)
        .text(`Duration: ${data.timeframe} weeks`);

      doc.moveDown();
      doc.fontSize(16).text('Meal Plan:', { underline: true });
      doc.moveDown();

      // Add each meal
      data.meals.forEach((meal: any, index: number) => {
        // Meal header
        doc.fontSize(14).text(`${meal.name} - ${meal.calories} kcal`, { continued: true });
        doc.fontSize(10).text(` (P: ${meal.protein}g | C: ${meal.carbs}g | F: ${meal.fat}g)`, { align: 'right' });
        
        // Recommended foods
        if (meal.foods && meal.foods.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(12).text('Recommended Foods:', { underline: true });
          
          meal.foods.forEach((food: any) => {
            doc.fontSize(10).text(`• ${food.name}: ${food.portion}`);
          });
        }
        
        doc.moveDown(1);
      });

      // Add tips section
      doc.moveDown();
      doc.fontSize(16).text('Tips for Success:', { underline: true });
      doc.moveDown(0.5);
      
      const tips = [
        'Stay hydrated with at least 8 glasses of water daily.',
        'Try to eat your meals at consistent times each day.',
        'Prioritize whole foods over processed alternatives.',
        'Track your progress weekly and adjust as needed.',
        'Combine this plan with appropriate physical activity.',
      ];
      
      tips.forEach(tip => {
        doc.fontSize(10).text(`• ${tip}`);
      });
      
      // Add disclaimer
      doc.moveDown(2);
      doc.fontSize(8).text('Disclaimer: This diet plan is generated based on your provided information and general guidelines. It is not a substitute for professional medical or nutritional advice. Always consult with healthcare professionals for personalized dietary recommendations.', {
        align: 'center',
        width: 400
      });
      
      // Finalize the PDF
      doc.end();
    });

    // Wait for the PDF generation to complete
    const pdfBuffer = await pdfPromise;

    // Return the PDF as a downloadable file
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="diet-plan-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
