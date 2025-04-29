import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint is for debugging environment variable issues
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  // Return if API key is set (but don't reveal the actual key for security)
  return NextResponse.json({
    apiKeySet: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyFirstChars: apiKey ? apiKey.substring(0, 3) + "..." : null,
    envVars: Object.keys(process.env)
      .filter(key => key.includes('GOOGLE') || key.includes('API'))
      .map(key => ({ key, set: !!process.env[key] })),
  });
}
