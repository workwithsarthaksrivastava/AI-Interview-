import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetCompanies, handleCreateCompany } from '../../src/server-utils/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') return handleCreateCompany(req, res);
  return handleGetCompanies(req, res);
}
