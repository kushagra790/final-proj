import mongoose from 'mongoose';

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  initialHealthDataSubmitted: boolean;
  email: string;
  lastMetricsUpdate?: Date; // Track when metrics were last updated
  metricsUpdateCount: number; // Count of metrics updates
}

const UserProfileSchema = new mongoose.Schema<IUserProfile>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true },
    initialHealthDataSubmitted: { type: Boolean, default: false },
    email: { type: String, required: true },
    lastMetricsUpdate: { type: Date },
    metricsUpdateCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);