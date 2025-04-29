import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFoodEntry extends Document {
  userId: string;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  fiber_g?: number;
  protein_percent?: number;
  carbs_percent?: number;
  fats_percent?: number;
  meal_type?: string;
  recorded_at: Date;
  image_url?: string;
}

const FoodEntrySchema = new Schema<IFoodEntry>(
  {
    userId: { 
      type: String, 
      required: true 
    },
    food_name: { 
      type: String, 
      required: true 
    },
    calories: { 
      type: Number, 
      required: true 
    },
    protein_g: Number,
    carbs_g: Number,
    fats_g: Number,
    fiber_g: Number,
    protein_percent: Number,
    carbs_percent: Number,
    fats_percent: Number,
    meal_type: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      default: 'Snack'
    },
    recorded_at: {
      type: Date,
      default: Date.now
    },
    image_url: String
  },
  {
    timestamps: true
  }
);

// Add indexes for faster queries
FoodEntrySchema.index({ userId: 1, recorded_at: -1 });
FoodEntrySchema.index({ userId: 1, meal_type: 1 });

let FoodEntry: Model<IFoodEntry>;

// Check if the model already exists to prevent overwriting
if (mongoose.models && mongoose.models.FoodEntry) {
  FoodEntry = mongoose.models.FoodEntry as Model<IFoodEntry>;
} else {
  FoodEntry = mongoose.model<IFoodEntry>('FoodEntry', FoodEntrySchema);
}

export default FoodEntry;
