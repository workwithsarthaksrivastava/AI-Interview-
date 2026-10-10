import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetAvailability, handleUpdateAvailability } from '../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'PUT' || req.method === 'POST') return handleUpdateAvailability(req, res);
  return handleGetAvailability(req, res);
}
