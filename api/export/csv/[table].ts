import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleExportCsv } from '../../../src/server-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const table = (req.query.table as string) || '';
  return handleExportCsv(req, res, table);
}
