import { requireAuth } from '../_lib/auth.js';
import { q } from '../_lib/db.js';
import { allowCors, options } from '../_lib/http.js';

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;

  const { rows } = await q(`
    select character_id,
           count(*)::int as plays,
           max(score)::int as best_score,
           max(survival_ms)::int as best_survival,
           coalesce(sum(useful_caught),0)::int as total_useful_caught,
           coalesce(sum(useful_missed),0)::int as total_useful_missed,
           coalesce(sum(spam_jumped),0)::int as total_spam_jumped,
           coalesce(sum(spam_caught),0)::int as total_spam_caught
    from runs
    group by character_id
  `);
  res.status(200).json({ rows });
}
