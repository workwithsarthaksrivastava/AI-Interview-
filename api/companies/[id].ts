import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpdateCompany } from '../../src/server-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const id = (req.query.id as string) || '';
  return handleUpdateCompany(req, res, id);
}
