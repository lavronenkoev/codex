import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve('.');
const PORT = Number(process.env.PORT || 3000);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function isSafePath(urlPath) {
  return !urlPath.includes('..') && !urlPath.includes('\\');
}

const server = createServer(async (req, res) => {
  try {
    const rawPath = (req.url || '/').split('?')[0];
    const pathname = decodeURIComponent(rawPath || '/');

    if (!isSafePath(pathname)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = join(ROOT, 'index.html');
    } else if (pathname.startsWith('/api/')) {
      res.writeHead(501, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'API is not used in this local app build' }));
      return;
    } else {
      filePath = join(ROOT, pathname);
    }

    let body;
    try {
      body = await readFile(filePath);
    } catch {
      body = await readFile(join(ROOT, 'index.html'));
      res.writeHead(200, { 'Content-Type': mime['.html'] });
      res.end(body);
      return;
    }

    const type = mime[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Local P&L app started at http://0.0.0.0:${PORT}`);
});
