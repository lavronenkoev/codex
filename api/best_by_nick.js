import { requireAuth } from './_lib/auth.js';
import { q } from './_lib/db.js';
import { allowCors, options } from './_lib/http.js';

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));
  const { rows } = await q(`
    with ranked as (
      select *, row_number() over (
        partition by nick order by score desc, survival_ms desc, accuracy desc, created_at asc
      ) as rn
      from runs
    )
    select * from ranked where rn = 1
    order by score desc, survival_ms desc, accuracy desc, created_at asc
    limit $1
  `, [limit]);
  res.status(200).json({ rows });
}
