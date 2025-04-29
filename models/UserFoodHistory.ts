import mongoose from 'mongoose';

// Schema to store aggregated daily food intake data for faster historical queries
const UserFoodHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFats: {
    type: Number,
    default: 0
  },
  entryCount: {
    type: Number,
    default: 0
  },
  foodEntryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodEntry'
  }]
}, {
  timestamps: true
});

// Create compound index for userId + date for efficient queries
UserFoodHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

// Create the model if it doesn't already exist
export const UserFoodHistory = mongoose.models.UserFoodHistory || 
  mongoose.model('UserFoodHistory', UserFoodHistorySchema);

export default UserFoodHistory;
