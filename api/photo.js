import { Redis } from '@upstash/redis';

// Initialize Upstash Redis from env vars (auto-set when you add Redis integration in Vercel)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Generate a short random ID (8 chars, alphanumeric)
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST — Store a photo, return short ID
  if (req.method === 'POST') {
    try {
      const { photo } = req.body;

      if (!photo || typeof photo !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "photo" field (base64 string expected)' });
      }

      // Generate unique ID (retry if collision, though extremely unlikely)
      let id = generateId();
      let attempts = 0;
      while (await redis.exists(`photo:${id}`) && attempts < 5) {
        id = generateId();
        attempts++;
      }

      // Store in Redis with 1-hour TTL (3600 seconds) — auto-deletes after expiry
      await redis.set(`photo:${id}`, photo, { ex: 3600 });

      return res.status(200).json({ id });
    } catch (err) {
      console.error('POST /api/photo error:', err);
      return res.status(500).json({ error: 'Failed to store photo' });
    }
  }

  // GET — Retrieve a photo by ID
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing "id" query parameter' });
      }

      const photo = await redis.get(`photo:${id}`);

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found or expired' });
      }

      return res.status(200).json({ photo });
    } catch (err) {
      console.error('GET /api/photo error:', err);
      return res.status(500).json({ error: 'Failed to retrieve photo' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
