// 'use client';

// import { 
//   generateTextToTextServer,
//   generateTextAndImageToTextServer,
//   generateTextToImageServer,
//   generateExerciseImageServer
// } from './server-generative-ai';

// // Client-safe wrapper functions that call the server functions
// export const generateTextToText = async (prompt: string) => {
//   return generateTextToTextServer(prompt);
// };

// export const generateTextAndImageToText = async (prompt: string, imageUrl: string) => {
//   console.log(imageUrl);
  
//   return generateTextAndImageToTextServer(prompt, imageUrl);
// };

// export const generateTextToImage = async (prompt: string, foodName: string = "food") => {
//   return generateTextToImageServer(prompt, foodName);
// };

// export const generateExerciseImage = async (prompt: string, exerciseName: string = "exercise") => {
//   return generateExerciseImageServer(prompt, exerciseName);
// };

// lib/server-generative-ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

/**
 * Server-side function to generate text from a text prompt
 */
export async function generateTextToTextServer(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error generating AI text response:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Server-side function to generate text from text and image inputs
 */
export async function generateTextAndImageToTextServer(prompt: string, imageUrl: string): Promise<string> {
  try {
    // Create a client for the Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Convert the image to a blob
    const imageBlob = await imageResponse.blob();
    
    // Convert blob to base64 for Gemini API
    const imageBase64 = await blobToBase64(imageBlob);
    const mimeType = imageBlob.type || 'image/jpeg';
    
    // Create the image part for the Gemini API
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    };
    
    // Generate content using the model
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error: any) {
    console.error('Error generating AI response with image:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Server-side function to generate an image from text
 */
export async function generateTextToImageServer(prompt: string, fileName: string = "food"): Promise<string> {
  try {
    // This is a placeholder - implement your image generation logic here
    // You might use services like DALL-E, Stable Diffusion API, etc.
    throw new Error("Image generation not implemented");
  } catch (error: any) {
    console.error('Error generating AI image:', error);
    throw new Error(`Image generation error: ${error.message}`);
  }
}

/**
 * Server-side function to generate an exercise image
 */
export async function generateExerciseImageServer(prompt: string, exerciseName: string = "exercise"): Promise<string> {
  try {
    // This is a placeholder - implement your exercise image generation logic here
    throw new Error("Exercise image generation not implemented");
  } catch (error: any) {
    console.error('Error generating exercise image:', error);
    throw new Error(`Exercise image generation error: ${error.message}`);
  }
}

/**
 * Converts a Blob to a base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}