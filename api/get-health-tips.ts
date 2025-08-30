import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function is a Vercel Serverless Function
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract the item list from the request body
  const { itemList } = req.body;

  if (!itemList || typeof itemList !== 'string' || itemList.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid "itemList" in request body' });
  }
  
  // Check for the API key in server-side environment variables
  if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'The AI service is not configured on the server. The API_KEY is missing.' });
  }

  // Construct the prompt for the AI model
  const prompt = `
    You are a "Health & Wellness Advisor".
    Analyze the following grocery list: ${itemList}.

    Based on this list, provide brief and simple health tips in tailored bullet points. Your advice should be based on generally accepted, reliable health information. Do not provide medical advice.

    For key items on the list, please provide:
    1.  **Key Health Benefits**: What are the main positive effects of consuming this item?
    2.  **Consumption Tips & Precautions**: Any advice on preparation, consumption, or potential precautions.
    3.  **Optimal Consumption Time**: Suggest when it might be best to eat the item for maximum benefit (e.g., "Bananas are great for a pre-workout energy boost").

    Structure your response using markdown with clear headings (like '## Item Name') and bullet points ('*'). Keep the tone encouraging and easy to understand.
  `;

  try {
    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Generate content from the model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    // Send the AI's response back to the client
    return res.status(200).json({ tips: response.text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a generic error to the client for security
    return res.status(500).json({ error: 'Failed to generate health tips from the AI service.' });
  }
}
