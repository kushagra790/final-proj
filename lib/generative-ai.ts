'use client';

import { 
  generateTextToTextServer,
  generateTextAndImageToTextServer,
  generateTextToImageServer,
  generateExerciseImageServer
} from './server-generative-ai';

// Client-safe wrapper functions that call the server functions
export const generateTextToText = async (prompt: string) => {
  return generateTextToTextServer(prompt);
};

export const generateTextAndImageToText = async (prompt: string, imageUrl: string) => {
  return generateTextAndImageToTextServer(prompt, imageUrl);
};

export const generateTextToImage = async (prompt: string, foodName: string = "food") => {
  return generateTextToImageServer(prompt, foodName);
};

export const generateExerciseImage = async (prompt: string, exerciseName: string = "exercise") => {
  return generateExerciseImageServer(prompt, exerciseName);
};
