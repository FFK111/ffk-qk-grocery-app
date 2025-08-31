
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// This function signature is for Vercel Serverless Functions.
// It uses a Request-like and Response-like object.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { itemList } = req.body;

        if (!itemList) {
            return res.status(400).json({ error: 'Missing itemList in request body' });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY environment variable not set on server.");
            // 412 Precondition Failed indicates a server-side configuration issue.
            return res.status(412).json({ error: 'API_KEY_MISSING' });
        }

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

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const tips = response.text;
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ tips });

    } catch (error) {
        console.error("Error calling Gemini API in serverless function:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return res.status(500).json({ error: `Failed to generate health tips. Details: ${errorMessage}` });
    }
}
