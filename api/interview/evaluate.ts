import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEvaluate } from '../../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return handleEvaluate(req, res);
}
