import mongoose from 'mongoose';

export interface IDietPlan extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  dailyCalories: number;
  goalWeight: number;
  timeframe: number;
  dietType: string;
  mealCount: number;
  includeSnacks: boolean;
  meals: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    foods: Array<{
      name: string;
      portion: string;
      imageUrl?: string;
    }>;
  }>;
  // New fields for weekly plan
  isWeeklyPlan?: boolean;
  baseOnPlanId?: mongoose.Types.ObjectId;
  weeklyPlanData?: Array<{
    day: string;
    meals: {
      breakfast: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        foods: Array<{
          name: string;
          portion: string;
          imageUrl?: string;
        }>;
      };
      lunch: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        foods: Array<{
          name: string;
          portion: string;
          imageUrl?: string;
        }>;
      };
      dinner: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        foods: Array<{
          name: string;
          portion: string;
          imageUrl?: string;
        }>;
      };
    };
  }>;
  weekStartDate?: Date;
  createdAt: Date;
}

const DietPlanSchema = new mongoose.Schema<IDietPlan>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dailyCalories: { type: Number, required: true },
    goalWeight: { type: Number, required: true },
    timeframe: { type: Number, required: true },
    dietType: { type: String, required: true },
    mealCount: { type: Number, required: true },
    includeSnacks: { type: Boolean, default: true },
    meals: [{
      name: { type: String, required: true },
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
      foods: [{
        name: { type: String, required: true },
        portion: { type: String, required: true },
        imageUrl: { type: String }
      }]
    }],
    // New fields for weekly plan
    isWeeklyPlan: { type: Boolean, default: false },
    baseOnPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan' },
    weeklyPlanData: [{
      day: { type: String, required: function() { return this.isWeeklyPlan; } },
      meals: {
        breakfast: {
          name: { type: String, default: 'Breakfast' },
          calories: { type: Number },
          protein: { type: Number },
          carbs: { type: Number },
          fat: { type: Number },
          foods: [{
            name: { type: String },
            portion: { type: String },
            imageUrl: { type: String }
          }]
        },
        lunch: {
          name: { type: String, default: 'Lunch' },
          calories: { type: Number },
          protein: { type: Number },
          carbs: { type: Number },
          fat: { type: Number },
          foods: [{
            name: { type: String },
            portion: { type: String },
            imageUrl: { type: String }
          }]
        },
        dinner: {
          name: { type: String, default: 'Dinner' },
          calories: { type: Number },
          protein: { type: Number },
          carbs: { type: Number },
          fat: { type: Number },
          foods: [{
            name: { type: String },
            portion: { type: String },
            imageUrl: { type: String }
          }]
        }
      }
    }],
    weekStartDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.DietPlan || mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);
