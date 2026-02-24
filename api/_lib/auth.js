import crypto from 'crypto';

const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPart(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + TOKEN_TTL_SEC };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const s = signPart(`${h}.${p}`, secret);
  return `${h}.${p}.${s}`;
}

export function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || !token) return null;
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = signPart(`${h}.${p}`, secret);
    const a = Buffer.from(s);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function requireAuth(req, res) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return payload;
}
