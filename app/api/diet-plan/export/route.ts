import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import DietPlan from "@/models/DietPlan";
import PDFDocument from 'pdfkit';
import { format, addDays } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, format: outputFormat = 'pdf' } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Diet plan ID required" }, { status: 400 });
    }

    await dbConnect();
    
    // Find the diet plan
    const dietPlan = await DietPlan.findById(id);

    if (!dietPlan) {
      return NextResponse.json({ error: "Diet plan not found" }, { status: 404 });
    }

    // Check if the diet plan belongs to the authenticated user
    if (dietPlan.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (outputFormat === 'pdf') {
      return generateWeeklyPlanPdf(dietPlan);
    } else {
      return NextResponse.json({ error: "Unsupported export format" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error exporting diet plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateWeeklyPlanPdf(dietPlan: any) {
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
    doc.fontSize(25).text('Weekly Meal Plan', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Generated on: ${format(new Date(), "MMMM d, yyyy")}`, { align: 'center' });
    doc.moveDown();

    // Diet plan details
    const dietType = dietPlan.dietType ? 
      `${dietPlan.dietType.charAt(0).toUpperCase() + dietPlan.dietType.slice(1)}` : 'Personalized';
    
    doc.fontSize(16).text('Plan Overview:', { underline: true });
    doc.fontSize(12)
      .text(`Diet Type: ${dietType}`)
      .text(`Daily Calories: ${dietPlan.dailyCalories} kcal`);

    doc.moveDown();
    
    if (dietPlan.isWeeklyPlan && dietPlan.weeklyPlanData && dietPlan.weekStartDate) {
      const weekStartDate = new Date(dietPlan.weekStartDate);
      
      dietPlan.weeklyPlanData.forEach((dayPlan: any, index: number) => {
        const currentDate = addDays(weekStartDate, index);
        const dayName = format(currentDate, "EEEE");
        const dateString = format(currentDate, "MMMM d, yyyy");
        
        doc.moveDown();
        doc.fontSize(16).text(`${dayName} - ${dateString}`, { underline: true });
        doc.moveDown(0.5);
        
        // Breakfast
        doc.fontSize(14).text("Breakfast");
        if (dayPlan.meals.breakfast) {
          const breakfast = dayPlan.meals.breakfast;
          doc.fontSize(10).text(`Total: ${breakfast.calories} kcal (P: ${breakfast.protein}g | C: ${breakfast.carbs}g | F: ${breakfast.fat}g)`);
          doc.moveDown(0.2);
          
          if (breakfast.foods && breakfast.foods.length > 0) {
            breakfast.foods.forEach((food: any) => {
              doc.fontSize(10).text(`• ${food.name}: ${food.portion}`);
            });
          }
        }
        doc.moveDown(0.5);
        
        // Lunch
        doc.fontSize(14).text("Lunch");
        if (dayPlan.meals.lunch) {
          const lunch = dayPlan.meals.lunch;
          doc.fontSize(10).text(`Total: ${lunch.calories} kcal (P: ${lunch.protein}g | C: ${lunch.carbs}g | F: ${lunch.fat}g)`);
          doc.moveDown(0.2);
          
          if (lunch.foods && lunch.foods.length > 0) {
            lunch.foods.forEach((food: any) => {
              doc.fontSize(10).text(`• ${food.name}: ${food.portion}`);
            });
          }
        }
        doc.moveDown(0.5);
        
        // Dinner
        doc.fontSize(14).text("Dinner");
        if (dayPlan.meals.dinner) {
          const dinner = dayPlan.meals.dinner;
          doc.fontSize(10).text(`Total: ${dinner.calories} kcal (P: ${dinner.protein}g | C: ${dinner.carbs}g | F: ${dinner.fat}g)`);
          doc.moveDown(0.2);
          
          if (dinner.foods && dinner.foods.length > 0) {
            dinner.foods.forEach((food: any) => {
              doc.fontSize(10).text(`• ${food.name}: ${food.portion}`);
            });
          }
        }
        
        // Add a page break after each day except the last one
        if (index < dietPlan.weeklyPlanData.length - 1) {
          doc.addPage();
        }
      });
    }

    // Add disclaimer
    doc.moveDown(2);
    doc.fontSize(8).text('Disclaimer: This meal plan is generated based on your provided information and general guidelines. It is not a substitute for professional nutritional advice. Always consult with healthcare professionals for personalized dietary recommendations.', {
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
      'Content-Disposition': `attachment; filename="weekly-meal-plan-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
    },
  });
}
