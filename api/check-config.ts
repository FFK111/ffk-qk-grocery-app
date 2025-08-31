import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * This endpoint checks if the server-side environment is configured
 * with a Gemini API key. It does not expose the key itself.
 */
export default function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const isConfigured = !!process.env.API_KEY;
    return res.status(200).json({ isConfigured });
  } catch (error) {
    console.error('Error in /api/check-config:', error);
    return res.status(500).json({ error: 'Internal server error while checking configuration.' });
  }
}
