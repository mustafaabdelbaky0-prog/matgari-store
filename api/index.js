const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const Router = require('../lib/router');
const { getMerchantFromToken, parseCookies } = require('../lib/auth');
const { redirect } = require('../lib/http-helpers');
const { runWithContext, setRequestMerchant } = require('../lib/req-context');

const router = new Router();
require('../routes/auth').registerRoutes(router);
require('../routes/dashboard').registerRoutes(router);
require('../routes/products').registerRoutes(router);
require('../routes/sales').registerRoutes(router);
require('../routes/purchases').registerRoutes(router);
require('../routes/cash').registerRoutes(router);
require('../routes/settings').registerRoutes(router);
require('../routes/store').registerRoutes(router);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/onboarding'];
const AUTH_ONLY_ONBOARDED_PREFIX = '/dashboard';

function serveStatic(req, res, pathname) {
  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end();
    return true;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=300' });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname !== '/' && serveStatic(req, res, pathname)) return;

  const cookies = parseCookies(req);
  const merchant = await getMerchantFromToken(cookies.session);
  setRequestMerchant(req, merchant);
  // Coerce Postgres INTEGER to Number so `=== 1` comparisons are reliable.
  const ob = merchant ? Number(merchant.onboarded) : 0;

  const needsAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth && !merchant) return redirect(res, '/login');
  if (pathname.startsWith(AUTH_ONLY_ONBOARDED_PREFIX) && merchant && ob !== 1) {
    return redirect(res, '/onboarding');
  }
  if (pathname === '/onboarding' && merchant && ob === 1 && req.method === 'GET') {
    return redirect(res, '/dashboard');
  }

  if (pathname === '/') {
    if (merchant) return redirect(res, ob === 1 ? '/dashboard' : '/onboarding');
    return redirect(res, '/login');
  }
  if ((pathname === '/login' || pathname === '/register') && merchant && req.method === 'GET') {
    return redirect(res, ob === 1 ? '/dashboard' : '/onboarding');
  }

  const match = router.match(req.method, pathname);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1 style="font-family:sans-serif;text-align:center;margin-top:80px;">404 - الصفحة غير موجودة</h1>');
    return;
  }
  await match.handler(req, res, match.params);
}

module.exports = (req, res) => {
  return runWithContext({ merchant: null }, async () => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1 style="font-family:sans-serif;text-align:center;margin-top:80px;">حصل خطأ، حاول تاني</h1>');
      }
    }
  });
};
