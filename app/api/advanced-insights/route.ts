import { NextResponse } from 'next/server';
import { 
  generateSleepTrendAnalysis,
  generatePersonalActivityPlan,
  generateDietPlan,
  generateWorkoutProgram
} from '@/lib/advanced-insights';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    let insights = '';
    
    switch (type) {
      case 'sleep-trend':
        insights = await generateSleepTrendAnalysis(data);
        break;
      case 'activity-plan':
        insights = await generatePersonalActivityPlan(data);
        break;
      case 'diet-plan':
        insights = await generateDietPlan(data);
        break;
      case 'workout-program':
        insights = await generateWorkoutProgram(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating advanced insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate advanced insights' },
      { status: 500 }
    );
  }
}
