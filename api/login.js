import crypto from 'crypto';
import { createToken } from './_lib/auth.js';
import { allowCors, options } from './_lib/http.js';

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const expected = process.env.ACCESS_PASSWORD || '';
  const got = String(req.body?.password || '');
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });

  const token = createToken({ role: 'player' });
  return res.status(200).json({ token });
}
