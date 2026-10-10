import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetReportById } from '../../src/server-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = (req.query.id as string) || '';
  return handleGetReportById(req, res, id);
}
