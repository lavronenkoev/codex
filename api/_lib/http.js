export function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function options(req, res) {
  if (req.method === 'OPTIONS') {
    allowCors(res);
    res.status(204).end();
    return true;
  }
  return false;
}
