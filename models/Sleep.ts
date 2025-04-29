import mongoose from 'mongoose';

export interface ISleep extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SleepSchema = new mongoose.Schema<ISleep>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    quality: { 
      type: String, 
      enum: ['poor', 'fair', 'good', 'excellent'], 
      required: true 
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Create a compound index for user and date to ensure uniqueness and faster queries
SleepSchema.index({ userId: 1, date: 1 });

export default mongoose.models.Sleep || mongoose.model<ISleep>('Sleep', SleepSchema);
