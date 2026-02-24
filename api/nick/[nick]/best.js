import { requireAuth } from '../../_lib/auth.js';
import { q } from '../../_lib/db.js';
import { allowCors, options } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;
  const nick = String(req.query.nick || '').trim().toLowerCase();
  const { rows } = await q(`
    select * from runs where nick = $1
    order by score desc, survival_ms desc, accuracy desc, created_at asc
    limit 1
  `, [nick]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.status(200).json({ row: rows[0] });
}
