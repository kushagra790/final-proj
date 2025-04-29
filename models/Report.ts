import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReport extends Document {
  userId: string;
  title: string;
  generatedAt: Date;
  summary: string;
  healthScore: number;
  activityLevel: string;
  bmi?: number;
  riskLevel: string;
  
  // Health metrics
  healthMetrics: {
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;
  };

  // Nutritional data
  nutritionTrends: {
    labels: string[];
    calories: number[];
    protein: number[];
    carbs: number[];
    fats: number[];
  };

  // Vital signs
  vitalSigns: Array<{
    title: string;
    current: string;
    trend: string;
    lastMeasured: string;
    chartData?: Array<{ date: string; value: number }>;
  }>;

  // Activity data
  activityData?: {
    daily: {
      [key: string]: { value: string; target: string };
    };
    weeklyChart?: Array<{ day: string; steps: number; activeMinutes: number }>;
    activityTypes?: Array<{ type: string; duration: string; calories: string }>;
  };

  // Nutrition data
  nutritionData?: {
    consumed: number;
    target: number;
    macros: {
      [key: string]: { amount: string; target: string };
    };
    meals?: Array<{
      meal: string;
      time: string;
      calories: number;
      items: string;
    }>;
  };

  // Nutrition advice
  nutritionAdvice?: {
    summary: string;
    recommendations: string[];
  };

  // Predictions
  predictions?: Array<{
    title: string;
    prediction: string;
    recommendation: string;
    timeframe: string;
  }>;

  // Track which data was AI-generated
  aiGenerated?: {
    vitalSigns?: boolean;
    nutritionAdvice?: boolean;
    predictions?: boolean;
    activityData?: boolean;
    nutritionTrends?: boolean;
  };
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { 
      type: String, 
      required: true 
    },
    title: { 
      type: String, 
      default: () => `Health Report - ${new Date().toLocaleDateString()}` 
    },
    generatedAt: { 
      type: Date, 
      default: Date.now 
    },
    summary: String,
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    activityLevel: String,
    bmi: Number,
    riskLevel: String,
    
    healthMetrics: {
      height: Number,
      weight: Number,
      age: Number,
      gender: String
    },
    
    nutritionTrends: {
      labels: [String],
      calories: [Number],
      protein: [Number],
      carbs: [Number],
      fats: [Number]
    },
    
    vitalSigns: [{
      title: String,
      current: String,
      trend: String,
      lastMeasured: String,
      chartData: [{
        date: String,
        value: Number
      }]
    }],
    
    activityData: {
      daily: Schema.Types.Mixed,
      weeklyChart: [{
        day: String,
        steps: Number,
        activeMinutes: Number
      }],
      activityTypes: [{
        type: String,
        duration: String,
        calories: String
      }]
    },
    
    nutritionData: {
      consumed: Number,
      target: Number,
      macros: Schema.Types.Mixed,
      meals: [{
        meal: String,
        time: String,
        calories: Number,
        items: String
      }]
    },
    
    nutritionAdvice: {
      summary: String,
      recommendations: [String]
    },
    
    predictions: [{
      title: String,
      prediction: String,
      recommendation: String,
      timeframe: String
    }],
    
    // Track which data was AI-generated
    aiGenerated: {
      vitalSigns: Boolean,
      nutritionAdvice: Boolean,
      predictions: Boolean,
      activityData: Boolean,
      nutritionTrends: Boolean
    }
  },
  {
    timestamps: true
  }
);

// Add index for faster queries
ReportSchema.index({ userId: 1, generatedAt: -1 });

let Report: Model<IReport>;

// Check if the model already exists to prevent overwriting
if (mongoose.models && mongoose.models.Report) {
  Report = mongoose.models.Report as Model<IReport>;
} else {
  Report = mongoose.model<IReport>('Report', ReportSchema);
}

export default Report;
