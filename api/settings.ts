import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetSettings, handleUpdateSettings } from '../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'PUT' || req.method === 'POST') return handleUpdateSettings(req, res);
  return handleGetSettings(req, res);
}
