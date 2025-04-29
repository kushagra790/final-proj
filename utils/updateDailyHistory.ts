import FoodEntry from '../models/FoodEntry';
import UserFoodHistory from '../models/UserFoodHistory';
import mongoose from 'mongoose';

/**
 * Update the user's food history record for a specific day
 * This is typically called after adding/updating/deleting food entries
 */
export async function updateDailyHistory(userId: string, date: Date): Promise<void> {
  try {
    // Get the start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find all food entries for the user on this day
    const entries = await FoodEntry.find({
      userId,
      recorded_at: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();
    
    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein += entry.protein_g || 0;
      acc.carbs += entry.carbs_g || 0;
      acc.fats += entry.fats_g || 0;
      acc.entryIds.push(entry._id as mongoose.Types.ObjectId);
      return acc;
    }, { 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fats: 0,
      entryIds: [] as mongoose.Types.ObjectId[]
    });
    
    // Update or create the history record
    await UserFoodHistory.findOneAndUpdate(
      { userId, date: startOfDay },
      {
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFats: totals.fats,
        entryCount: entries.length,
        foodEntryIds: totals.entryIds
      },
      { upsert: true, new: true }
    );
    
  } catch (error) {
    console.error('Error updating daily food history:', error);
    throw new Error('Failed to update food history');
  }
}

/**
 * Update the history when a new food entry is added
 */
export async function updateHistoryOnNewEntry(entry: any): Promise<void> {
  const entryDate = new Date(entry.recorded_at);
  await updateDailyHistory(entry.userId, entryDate);
}

/**
 * Update the history when a food entry is modified
 */
export async function updateHistoryOnModifiedEntry(entry: any, oldDate?: Date): Promise<void> {
  const entryDate = new Date(entry.recorded_at);
  
  // Update history for the current entry date
  await updateDailyHistory(entry.userId, entryDate);
  
  // If the date was changed, also update the old date's history
  if (oldDate && oldDate.toDateString() !== entryDate.toDateString()) {
    await updateDailyHistory(entry.userId, oldDate);
  }
}

/**
 * Update the history when a food entry is deleted
 */
export async function updateHistoryOnDeletedEntry(entry: any): Promise<void> {
  const entryDate = new Date(entry.recorded_at);
  await updateDailyHistory(entry.userId, entryDate);
}

export default {
  updateDailyHistory,
  updateHistoryOnNewEntry,
  updateHistoryOnModifiedEntry,
  updateHistoryOnDeletedEntry
};
