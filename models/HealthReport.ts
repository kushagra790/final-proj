import mongoose from 'mongoose';

const HealthReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: "Health Report" // Added default value since it's required but not provided
  },
  summary: {
    type: String,
    required: true
  },
  healthScore: {
    type: Number,
    required: true
  },
  bmi: {
    type: Number
  },
  activityLevel: {
    type: String
  },
  riskLevel: {
    type: String
  },
  healthMetrics: {
    height: Number,
    weight: Number,
    age: Number,
    gender: String
  },
  predictions: [{
    title: String,
    prediction: String,
    recommendation: String,
    timeframe: String
  }],
  // Renamed from vitalsTrends to vitalSigns to match code
  vitalSigns: [{
    title: String,
    current: String,
    trend: String,
    lastMeasured: String,
    chartData: mongoose.Schema.Types.Mixed
  }],
  // Added activityData to match code
  activityData: mongoose.Schema.Types.Mixed,
  // Added nutritionData to match code
  nutritionData: mongoose.Schema.Types.Mixed,
  // Added nutritionAdvice to match code
  nutritionAdvice: {
    summary: String,
    recommendations: [String]
  },
  nutritionTrends: {
    labels: [String],
    calories: [Number],
    protein: [Number],
    carbs: [Number],
    fats: [Number]
  },
  // Added aiGenerated field
  aiGenerated: {
    vitalSigns: Boolean,
    nutritionAdvice: Boolean,
    predictions: Boolean,
    activityData: Boolean,
    nutritionTrends: Boolean
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for userId + generatedAt for efficient queries
HealthReportSchema.index({ userId: 1, generatedAt: -1 });

const HealthReport = mongoose.models.HealthReport || 
  mongoose.model('HealthReport', HealthReportSchema);

export default HealthReport;
