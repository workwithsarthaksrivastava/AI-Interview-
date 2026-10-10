import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDeepgramLogUsage } from '../../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  return handleDeepgramLogUsage(req, res);
}
