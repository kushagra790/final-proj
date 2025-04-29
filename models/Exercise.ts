import mongoose from 'mongoose';

export interface IExercise extends mongoose.Document {
  name: string;
  description: string;
  muscleGroups: string[];
  environment: string[]; // 'home', 'gym', or both
  difficulty: string;
  equipment: string[];
  formTips: string[];
  imageUrl?: string;
  category: string; // e.g., 'strength', 'cardio', 'flexibility'
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new mongoose.Schema<IExercise>(
  {
    name: { 
      type: String, 
      required: true,
      unique: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    muscleGroups: { 
      type: [String], 
      required: true 
    },
    environment: {
      type: [String],
      enum: ['home', 'gym'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    equipment: {
      type: [String],
      default: []
    },
    formTips: {
      type: [String],
      default: []
    },
    imageUrl: {
      type: String
    },
    category: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
