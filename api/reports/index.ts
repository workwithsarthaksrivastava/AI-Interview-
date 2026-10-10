import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetReports } from '../../src/server-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  return handleGetReports(req, res);
}
