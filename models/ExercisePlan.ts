import mongoose from 'mongoose';

export interface IExercisePlan extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  environment: string; // 'home' or 'gym'
  createdAt: Date;
  updatedAt: Date;
}

const ExercisePlanSchema = new mongoose.Schema<IExercisePlan>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    plan: { 
      type: String, 
      required: true 
    },
    environment: {
      type: String,
      enum: ['home', 'gym'],
      required: true
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.models.ExercisePlan || mongoose.model<IExercisePlan>('ExercisePlan', ExercisePlanSchema);
