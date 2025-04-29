import mongoose from 'mongoose';

export interface IHealthMetricsHistory extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  height: number;
  weight: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  sleepDuration?: number;
  stressLevel?: number;
  activityLevel: string;
  recordedAt: Date;
  notes?: string;
}

const HealthMetricsHistorySchema = new mongoose.Schema<IHealthMetricsHistory>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bloodPressure: { type: String },
    heartRate: { type: Number },
    respiratoryRate: { type: Number },
    temperature: { type: Number },
    sleepDuration: { type: Number },
    stressLevel: { type: Number },
    activityLevel: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

// Create indexes for faster queries when generating graphs
HealthMetricsHistorySchema.index({ userId: 1, recordedAt: 1 });
HealthMetricsHistorySchema.index({ userId: 1, createdAt: 1 });

export default mongoose.models.HealthMetricsHistory || 
  mongoose.model<IHealthMetricsHistory>('HealthMetricsHistory', HealthMetricsHistorySchema);
