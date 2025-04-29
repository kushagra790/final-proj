import mongoose from 'mongoose';

export interface IExerciseLog extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  sets: number;
  reps: number;
  caloriesBurned: number;
  date: Date;
  imageUrl?: string;
}

const ExerciseLogSchema = new mongoose.Schema<IExerciseLog>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    name: { 
      type: String, 
      required: true
    },
    category: { 
      type: String, 
      default: 'other' 
    },
    sets: { 
      type: Number, 
      required: true 
    },
    reps: { 
      type: Number, 
      required: true 
    },
    caloriesBurned: { 
      type: Number, 
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    imageUrl: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.models.ExerciseLog || mongoose.model<IExerciseLog>('ExerciseLog', ExerciseLogSchema);