const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

function createPreviewServer() {
  const root = __dirname;
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    if (pathname === '/') pathname = '/a.html';
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep) || !/\.(html|txt|png)$/.test(target)) {
      res.writeHead(404).end(); return;
    }
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = { '.html':'text/html; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.png':'image/png' };
      res.writeHead(200, { 'Content-Type':types[path.extname(target)], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
      res.end(data);
    });
  });
}

module.exports = { createPreviewServer };
if (require.main === module) {
  const port = Number(process.env.BYX_PREVIEW_PORT || 8742);
  const server = createPreviewServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`A: http://127.0.0.1:${port}/a.html`);
    console.log(`B: http://127.0.0.1:${port}/b.html`);
    console.log('Stop: Ctrl+C');
  });
}
