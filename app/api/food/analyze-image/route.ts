// import { NextResponse } from 'next/server';
// import { generateTextAndImageToText } from '@/lib/generative-ai';
// import { v2 as cloudinary } from 'cloudinary';

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file') as File;
//     console.log(file);
    
    
//     if (!file) {
//       return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
//     }
    
//     // Convert file to buffer for Cloudinary upload
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
    
//     // Base64 encode for AI analysis
//     const base64Image = buffer.toString('base64');
//     const dataURI = `data:${file.type};base64,${base64Image}`;
    
//     // Upload to Cloudinary
//     const cloudinaryUpload = await new Promise((resolve, reject) => {
//       cloudinary.uploader.upload_stream(
//         { 
//           folder: 'food_tracking',
//           resource_type: 'image'
//         },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       ).end(buffer);
//     });
    
//     const imageUrl = (cloudinaryUpload as any).secure_url;
    
//     // Prepare prompt for Gemini API
//     const prompt = `
//       You are a nutrition expert analyzing a food image. 
//       Please identify the food item in this image and provide its estimated nutritional information.
      
//       I need the following information in JSON format:
//       - food_name: The name of the food (be specific)
//       - calories: Estimated calories per serving
//       - protein_g: Estimated protein in grams
//       - carbs_g: Estimated carbohydrates in grams
//       - fats_g: Estimated fats in grams
      
//       Return ONLY a valid JSON object with these fields, no additional explanations or text.
//       Example format: {"food_name":"Apple","calories":95,"protein_g":0.5,"carbs_g":25,"fats_g":0.3}
//     `;
    
//     console.log("Sending food image for analysis...");
    
//     // Use Google Generative AI to analyze the image
//     const analysisResult = await generateTextAndImageToText(prompt, imageUrl);
//     console.log("Received analysis from Gemini:", analysisResult.substring(0, 200) + "...");
    
//     // Clean up the response to extract just the JSON part
//     let cleanedResult = analysisResult.trim();
    
//     // If response is wrapped in code blocks, extract just the JSON
//     const jsonMatch = cleanedResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
//     if (jsonMatch && jsonMatch[1]) {
//       cleanedResult = jsonMatch[1].trim();
//     }
    
//     // Try to parse the JSON response
//     try {
//       const foodData = JSON.parse(cleanedResult);
      
//       // Validate the required fields
//       if (!foodData.food_name || !foodData.calories) {
//         return NextResponse.json({
//           error: "Incomplete data from AI analysis",
//           raw_analysis: analysisResult,
//           parsed: foodData,
//           image_url: imageUrl
//         }, { status: 422 });
//       }
      
//       // Return the analyzed data with the image URL
//       return NextResponse.json({
//         ...foodData,
//         raw_analysis: analysisResult,
//         image_url: imageUrl
//       });
//     } catch (parseError) {
//       console.error("Failed to parse AI response:", parseError);
      
//       // Return the raw analysis result so the client might be able to handle it
//       return NextResponse.json({
//         error: "Could not parse AI response as JSON",
//         raw_analysis: analysisResult,
//         image_url: imageUrl
//       }, { status: 422 });
//     }
    
//   } catch (error: any) {
//     console.error('Image analysis error:', error);
//     return NextResponse.json({ 
//       error: `Failed to analyze food image: ${error.message}` 
//     }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';
import { generateTextAndImageToTextServer } from '@/lib/server-generative-ai';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    console.log(file);
    
    
    if (!file) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }
    
    // Convert file to buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Base64 encode for AI analysis
    const base64Image = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64Image}`;
    
    // Upload to Cloudinary
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'food_tracking',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    const imageUrl = (cloudinaryUpload as any).secure_url;
    
    // Prepare prompt for Gemini API
    const prompt = `
      You are a nutrition expert analyzing a food image. 
      Please identify the food item in this image and provide its estimated nutritional information.
      
      I need the following information in JSON format:
      - food_name: The name of the food (be specific)
      - calories: Estimated calories per serving
      - protein_g: Estimated protein in grams
      - carbs_g: Estimated carbohydrates in grams
      - fats_g: Estimated fats in grams
      
      Return ONLY a valid JSON object with these fields, no additional explanations or text.
      Example format: {"food_name":"Apple","calories":95,"protein_g":0.5,"carbs_g":25,"fats_g":0.3}
    `;
    
    console.log("Sending food image for analysis...");
    
    // Use Google Generative AI to analyze the image
    const analysisResult = await generateTextAndImageToTextServer(prompt, imageUrl);
    console.log("Received analysis from Gemini:", analysisResult.substring(0, 200) + "...");
    
    // Clean up the response to extract just the JSON part
    let cleanedResult = analysisResult.trim();
    
    // If response is wrapped in code blocks, extract just the JSON
    const jsonMatch = cleanedResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanedResult = jsonMatch[1].trim();
    }
    
    // Try to parse the JSON response
    try {
      const foodData = JSON.parse(cleanedResult);
      
      // Validate the required fields
      if (!foodData.food_name || !foodData.calories) {
        return NextResponse.json({
          error: "Incomplete data from AI analysis",
          raw_analysis: analysisResult,
          parsed: foodData,
          image_url: imageUrl
        }, { status: 422 });
      }
      
      // Return the analyzed data with the image URL
      return NextResponse.json({
        ...foodData,
        raw_analysis: analysisResult,
        image_url: imageUrl
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      
      // Return the raw analysis result so the client might be able to handle it
      return NextResponse.json({
        error: "Could not parse AI response as JSON",
        raw_analysis: analysisResult,
        image_url: imageUrl
      }, { status: 422 });
    }
    
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json({ 
      error: `Failed to analyze food image: ${error.message}` 
    }, { status: 500 });
  }
}