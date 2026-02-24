import { requireAuth } from './_lib/auth.js';
import { allowCors, options } from './_lib/http.js';

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;
  res.status(200).json({ ok: true, user });
}
