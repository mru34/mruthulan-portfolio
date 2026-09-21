// Post-build step: visits every real route against the built dist/ output and writes each
// route's fully-rendered HTML to its own static file, so crawlers and social-preview bots that
// never run JS get real content and the correct per-route <title>/description instead of the
// generic shell. main.tsx is untouched — this only produces the *first* HTML a browser sees;
// createRoot still takes over and re-renders normally once its JS loads.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, '..', 'dist');

const SLUGS = ['signalbridge', 'meant', 'bettercallbhai', 'knowcad', 'bossbreaker', 'loomy'];
const ROUTES = ['/', ...SLUGS.map((s) => `/work/${s}`), '/privacy'];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

// Serves dist/ like GH Pages: real files as-is, anything else (a client-side route) falls back
// to index.html with a 200 status so the SPA can take over.
function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const reqPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(DIST, reqPath);
      const isFile = path.extname(reqPath) !== '' && existsSync(filePath);
      const servedPath = isFile ? filePath : path.join(DIST, 'index.html');
      try {
        const body = await readFile(servedPath);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(servedPath)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function outputPathFor(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\//, ''), 'index.html');
}

async function main() {
  const server = await startServer();
  const { port } = server.address();
  // Uses the sandbox's pre-installed Chromium when present (pinned to a different revision than
  // this playwright version expects); falls back to Playwright's own managed browser otherwise.
  const pinnedChromium = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch(existsSync(pinnedChromium) ? { executablePath: pinnedChromium } : {});

  try {
    const page = await browser.newPage();
    for (const route of ROUTES) {
      await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
      // Let the route's own effects (document title/meta, IntersectionObserver reveals) settle.
      await page.waitForFunction(() => document.title.length > 0);
      await page.waitForTimeout(150);

      const html = '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
      const outPath = outputPathFor(route);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html);
      console.log(`prerendered ${route} -> ${path.relative(path.join(ROOT, '..'), outPath)}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
