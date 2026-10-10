import { dispatchApiRequest } from '../src/server-utils/index.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return dispatchApiRequest(req, res);
}
