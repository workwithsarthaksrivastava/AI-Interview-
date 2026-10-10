import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetInterviewById, handleUpdateInterview } from '../../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = (req.query.id as string) || '';
  if (req.method === 'PATCH' || req.method === 'PUT') return handleUpdateInterview(req, res, id);
  return handleGetInterviewById(req, res, id);
}
