import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import FoodEntry from '@/models/FoodEntry';
import { storeImage } from '@/utils/uploadImage';
import { 
  updateHistoryOnModifiedEntry, 
  updateHistoryOnDeletedEntry 
} from '@/utils/updateDailyHistory';

// Validation schema for food entry updates
const foodEntryUpdateSchema = z.object({
  food_name: z.string().min(1).optional(),
  calories: z.number().nonnegative().optional(),
  protein_g: z.number().nonnegative().optional(),
  carbs_g: z.number().nonnegative().optional(),
  fats_g: z.number().nonnegative().optional(),
  protein_percent: z.number().nonnegative().optional(),
  carbs_percent: z.number().nonnegative().optional(),
  fats_percent: z.number().nonnegative().optional(),
  image_url: z.string().optional(),
  ai_analysis_result: z.string().optional(),
});

// GET handler - fetch a specific food entry
export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    await dbConnect();
    
    const entry = await FoodEntry.findById(id).lean();
    
    if (!entry) {
      return NextResponse.json({ error: 'Food entry not found' }, { status: 404 });
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch food entry' }, { status: 500 });
  }
}

// PUT handler - update a food entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate the request body
    const result = foodEntryUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    
    await dbConnect();
    
    // Find the original entry first
    const originalEntry = await FoodEntry.find({ userId: id }).lean();
    if (!originalEntry) {
      return NextResponse.json({ error: 'Food entry not found' }, { status: 404 });
    }
    
    // Store the original date for history updates
    const originalDate = new Date((originalEntry as any).recorded_at);
    
    // Process new image if provided
    let updateData = result.data;
    if (updateData.image_url && updateData.image_url.startsWith('data:image')) {
      updateData.image_url = await storeImage(updateData.image_url);
    }
    
    // Update entry with additional updated_at timestamp
    const updatedEntry = await FoodEntry.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true } // Return updated document and run validators
    ).lean();
    
    // Update history records
    await updateHistoryOnModifiedEntry(updatedEntry, originalDate);
    
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update food entry' }, { status: 500 });
  }
}

// DELETE handler - delete a food entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    await dbConnect();
    
    // Get the entry before deleting for history update
    const deletedEntry = await FoodEntry.findById(id).lean();
    if (!deletedEntry) {
      return NextResponse.json({ error: 'Food entry not found' }, { status: 404 });
    }
    
    // Delete the entry
    await FoodEntry.findByIdAndDelete(id);
    
    // Update history records
    await updateHistoryOnDeletedEntry(deletedEntry);
    
    return NextResponse.json({ 
      message: 'Entry deleted successfully', 
      entry: deletedEntry 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete food entry' }, { status: 500 });
  }
}
