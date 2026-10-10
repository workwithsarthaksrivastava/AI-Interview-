import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetInterviews, handleCreateInterview } from '../../src/server-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') return handleCreateInterview(req, res);
  return handleGetInterviews(req, res);
}
