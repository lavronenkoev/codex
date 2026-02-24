import { requireAuth } from './_lib/auth.js';
import { q } from './_lib/db.js';
import { allowCors, options } from './_lib/http.js';

function normNick(n) {
  return String(n || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 24) || 'игрок';
}

function metrics(r) {
  const usefulCaught = r.useful_caught;
  const usefulMissed = r.useful_missed;
  const spamJumped = r.spam_jumped;
  const spamCaught = r.spam_caught;
  const totalEvents = usefulCaught + usefulMissed + spamJumped + spamCaught;
  return (usefulCaught + spamJumped) / Math.max(1, totalEvents);
}

function validateRun(body) {
  const ints = ['score', 'survivalMs', 'usefulCaught', 'usefulMissed', 'spamJumped', 'spamCaught'];
  for (const key of ints) {
    if (!Number.isFinite(body[key]) || body[key] < 0) return `${key} invalid`;
  }
  if (body.survivalMs > 1000 * 60 * 20) return 'survivalMs too high';
  if (body.score > 20000) return 'score too high';
  return null;
}

export default async function handler(req, res) {
  if (options(req, res)) return;
  allowCors(res);
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    const err = validateRun(req.body || {});
    if (err) return res.status(400).json({ error: err });

    const nickDisplay = String(req.body.nick || 'Игрок').trim().slice(0, 24) || 'Игрок';
    const nick = normNick(nickDisplay);
    const row = {
      nick,
      nickDisplay,
      characterId: String(req.body.characterId || '').slice(0, 64),
      score: Math.round(req.body.score),
      survivalMs: Math.round(req.body.survivalMs),
      usefulCaught: Math.round(req.body.usefulCaught),
      usefulMissed: Math.round(req.body.usefulMissed),
      spamJumped: Math.round(req.body.spamJumped),
      spamCaught: Math.round(req.body.spamCaught),
      clientHash: String(req.body.clientHash || '').slice(0, 128)
    };
    const accuracy = metrics({ useful_caught: row.usefulCaught, useful_missed: row.usefulMissed, spam_jumped: row.spamJumped, spam_caught: row.spamCaught });

    await q(
      `insert into runs (nick, nick_display, character_id, score, survival_ms, useful_caught, useful_missed, spam_jumped, spam_caught, accuracy, client_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [row.nick, row.nickDisplay, row.characterId, row.score, row.survivalMs, row.usefulCaught, row.usefulMissed, row.spamJumped, row.spamCaught, accuracy, row.clientHash || null]
    );
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'GET') {
    const sort = req.query.sort === 'survival' ? 'survival_ms' : 'score';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const character = String(req.query.character || 'all');
    const mode = String(req.query.mode || 'best');
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));

    const where = character === 'all' ? '' : 'where character_id = $1';
    const params = character === 'all' ? [limit] : [character, limit];

    if (mode === 'all') {
      const sql = `select * from runs ${where} order by ${sort} ${order}, survival_ms desc, accuracy desc, created_at asc limit $${params.length}`;
      const { rows } = await q(sql, params);
      return res.status(200).json({ rows });
    }

    const sql = `
      with ranked as (
        select *, row_number() over (
          partition by nick order by score desc, survival_ms desc, accuracy desc, created_at asc
        ) as rn
        from runs
        ${where}
      )
      select * from ranked where rn = 1
      order by ${sort} ${order}, survival_ms desc, accuracy desc, created_at asc
      limit $${params.length}
    `;
    const { rows } = await q(sql, params);
    return res.status(200).json({ rows });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
