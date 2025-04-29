'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function generateTextToTextServer(prompt: string) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateTextAndImageToTextServer(prompt: string, imageUrl: string) {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Data = buffer.toString("base64");

    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: contentType || "image/jpeg", // Default to jpeg if no content type
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

export async function generateTextToImageServer(prompt: string, foodName: string = "food") {
  // Format the food name for the file name (replace spaces with hyphens)
  const formattedName = foodName.trim().replace(/\s+/g, "-").toLowerCase();

  // Pre-defined Indian food image mapping - add common Indian dishes that may cause issues
  const indianFoodImageMap: Record<string, string> = {
    "poha": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_poha_bn6yvu.jpg",
    "upma": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_upma_lmdrzx.jpg",
    "idli": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_idli_u28pal.jpg",
    "dosa": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_dosa_vyqnao.jpg",
    "paratha": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_paratha_j6uwhb.jpg",
    "aloo-paratha": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_aloo_paratha_cptlnq.jpg",
    "dal": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_dal_hznygn.jpg",
    "paneer": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_paneer_dish_rbxm4k.jpg",
    "biryani": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_biryani_kjzjbd.jpg",
    "chaat": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_chaat_lgkozn.jpg",
    "chole": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_chole_bhature_yxsptl.jpg",
    "bhature": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_chole_bhature_yxsptl.jpg",
    "chole-bhature": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_chole_bhature_yxsptl.jpg",
    "rajma": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_rajma_xhgmhg.jpg",
    "samosa": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_samosa_tjwwnl.jpg",
    "thali": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_thali_wxv1od.jpg",
    "khichdi": "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/indian_khichdi_xaajzo.jpg"
  };

  // Check if the food name contains any of the key terms for Indian dishes
  const indianFoodKeyMatch = Object.keys(indianFoodImageMap).find(key => 
    formattedName.includes(key)
  );

  if (indianFoodKeyMatch) {
    console.log(`Using pre-defined image for Indian dish '${foodName}'`);
    return indianFoodImageMap[indianFoodKeyMatch];
  }

  try {
    // First, check if an image with the same food name already exists in Cloudinary
    const searchResult = await cloudinary.search
      .expression(`folder:food_items AND public_id:"food_items/${formattedName}"`)
      .max_results(1)
      .execute();

    // If the image already exists, return its URL
    if (searchResult && searchResult.resources && searchResult.resources.length > 0) {
      console.log(`Image for '${foodName}' already exists, reusing it`);
      return searchResult.resources[0].secure_url;
    }

    // Alternative approach: try to fetch the asset directly by ID
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.api.resource(`food_items/${formattedName}`, 
          (error: any, result: any) => {
            if (error && error.http_code !== 404) {
              reject(error);
            } else if (!error) {
              resolve(result);
            } else {
              resolve(null);
            }
          });
      });
      
      if (result) {
        console.log(`Found existing image for '${foodName}' using direct lookup`);
        return (result as any).secure_url;
      }
    } catch (lookupError) {
      console.log(`Asset lookup failed:`, lookupError);
      // Continue with searching a new image
    }

    // If no existing image was found, search for one using Google Search API
    console.log(`Searching image for '${foodName}'`);
    
    // Enhance search query for Indian food
    let searchQuery = `${foodName} food photography appetizing dish`;
    if (foodName.toLowerCase().includes('indian') || 
        prompt.toLowerCase().includes('indian')) {
      searchQuery = `${foodName} authentic indian food photography`;
    }
    
    const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?` +
      `key=${process.env.GOOGLE_SEARCH_API_KEY}` +
      `&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}` +
      `&q=${encodeURIComponent(searchQuery)}` +
      `&searchType=image` +
      `&imgSize=large` +
      `&num=1` +
      `&safe=active`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      // If search fails, use fallback generic food image
      console.error(`Failed to search for images: ${searchResponse.status}`);
      return "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/generic_indian_food_lk3nty.jpg";
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      // If no images found, use fallback generic food image
      console.error("No images found in search results");
      return "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/generic_indian_food_lk3nty.jpg";
    }
    
    const imageUrl = searchData.items[0].link;
    
    // Fetch the image data from the URL
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Upload to Cloudinary with the food name
      const cloudinaryUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "food_items",
              public_id: formattedName, // Use the formatted food name as the file name
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });
      
      // Return the Cloudinary URL
      return (cloudinaryUpload as any).secure_url;
    } catch (fetchError) {
      console.error("Error fetching or uploading image:", fetchError);
      // Use fallback image by food type
      if (prompt.toLowerCase().includes('indian')) {
        return "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/generic_indian_food_lk3nty.jpg";
      } else {
        return "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/generic_food_plate_xorqfj.jpg";
      }
    }
  } catch (error) {
    console.error("Error in generateTextToImage:", error);
    // Use generic fallback image
    return "https://res.cloudinary.com/dpqxboqmx/image/upload/v1714422568/food_items/generic_food_plate_xorqfj.jpg";
  }
}

export async function generateExerciseImageServer(prompt: string, exerciseName: string = "exercise") {
  // Format the exercise name for the file name (replace spaces with hyphens)
  const formattedName = exerciseName.trim().replace(/\s+/g, "-").toLowerCase();

  try {
    // First, check if an image with the same exercise name already exists in Cloudinary
    const searchResult = await cloudinary.search
      .expression(`folder:exercise_items AND public_id:"exercise_tracking/${formattedName}"`)
      .max_results(1)
      .execute();

    // If the image already exists, return its URL
    if (searchResult && searchResult.resources && searchResult.resources.length > 0) {
      console.log(`Image for '${exerciseName}' already exists, reusing it`);
      return searchResult.resources[0].secure_url;
    }

    // Alternative approach: try to fetch the asset directly by ID
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.api.resource(`exercise_tracking/${formattedName}`, 
          (error: any, result: any) => {
            if (error && error.http_code !== 404) {
              reject(error);
            } else if (!error) {
              resolve(result);
            } else {
              resolve(null);
            }
          });
      });
      
      if (result) {
        console.log(`Found existing image for '${exerciseName}' using direct lookup`);
        return (result as any).secure_url;
      }
    } catch (lookupError) {
      console.log(`Asset lookup failed:`, lookupError);
      // Continue with searching a new image
    }

    // If no existing image was found, search for one using Google Search API
    console.log(`Searching image for '${exerciseName}'`);
    
    // Use Google Custom Search API to find an image
    const searchQuery = `${exerciseName} exercise fitness workout`;
    const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?` +
      `key=${process.env.GOOGLE_SEARCH_API_KEY}` +
      `&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}` +
      `&q=${encodeURIComponent(searchQuery)}` +
      `&searchType=image` +
      `&imgSize=large` +
      `&num=1` +
      `&safe=active`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Failed to search for images: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("No images found in search results");
    }
    
    const imageUrl = searchData.items[0].link;
    
    // Fetch the image data from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Upload to Cloudinary with the exercise name
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "exercise_tracking",
            public_id: formattedName, // Use the formatted exercise name as the file name
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });
    
    // Return the Cloudinary URL
    return (cloudinaryUpload as any).secure_url;
  } catch (error) {
    console.error("Error in generateExerciseImage:", error);
    throw error;
  }
}