import { NextResponse } from 'next/server';
import { 
  generateSleepInsights, 
  generateActivityInsights,
  generateNutritionInsights,
  generateExerciseInsights 
} from '@/lib/insights-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    let insights = '';
    
    switch (type) {
      case 'sleep':
        insights = await generateSleepInsights(data);
        break;
      case 'activity':
        insights = await generateActivityInsights(data);
        break;
      case 'nutrition':
        insights = await generateNutritionInsights(data);
        break;
      case 'exercise':
        insights = await generateExerciseInsights(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
