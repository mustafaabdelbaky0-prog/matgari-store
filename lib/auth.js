// auth.js — تسجيل الدخول والجلسات (async — Postgres backend)
const crypto = require('crypto');
const { query, queryOne, exec } = require('./db');

// How long a session stays valid server-side. Must match the cookie's
// Max-Age (set in routes/auth.js) — a stolen/leaked token is only useful for
// this long, instead of forever.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function createSession(merchantId) {
  const token = crypto.randomBytes(32).toString('hex');
  await exec('INSERT INTO sessions (token, merchant_id) VALUES ($1, $2)', [token, merchantId]);
  return token;
}

async function destroySession(token) {
  if (!token) return;
  await exec('DELETE FROM sessions WHERE token = $1', [token]);
}

async function getMerchantFromToken(token) {
  if (!token) return null;
  const row = await queryOne(
    `SELECT m.* FROM sessions s JOIN merchants m ON m.id = s.merchant_id
     WHERE s.token = $1 AND s.created_at > NOW() - ($2 || ' seconds')::interval`,
    [token, String(SESSION_MAX_AGE_SECONDS)]
  );
  // Opportunistic cleanup of long-expired sessions (small % of requests) so
  // the table doesn't grow forever — no separate cron job needed.
  if (Math.random() < 0.01) {
    exec(
      `DELETE FROM sessions WHERE created_at < NOW() - ($1 || ' seconds')::interval`,
      [String(SESSION_MAX_AGE_SECONDS)]
    ).catch(() => {});
  }
  return row || null;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function setCookie(res, name, value, opts = {}) {
  // Secure means the browser only ever sends this cookie over HTTPS, which is
  // all Vercel serves anyway — this just makes that guarantee explicit
  // instead of relying on the platform. Skipped only for local http://
  // development so the app still works with `node server.js` on localhost.
  const isLocalDev = !process.env.VERCEL;
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (!isLocalDev) parts.push('Secure');
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.maxAge === 0) parts.push('Max-Age=0');
  const prev = res.getHeader('Set-Cookie');
  const cookieStr = parts.join('; ');
  if (prev) {
    res.setHeader('Set-Cookie', Array.isArray(prev) ? [...prev, cookieStr] : [prev, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', cookieStr);
  }
}

const ARABIC_TO_LATIN_FALLBACK = 'my-store';

function slugify(text) {
  let s = (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[ً-ْ]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) s = ARABIC_TO_LATIN_FALLBACK;
  return s;
}

async function uniqueSlug(base) {
  const slug = slugify(base);
  let candidate = slug;
  let i = 1;
  while (await queryOne('SELECT id FROM merchants WHERE slug = $1', [candidate])) {
    i += 1;
    candidate = `${slug}-${i}`;
  }
  return candidate;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getMerchantFromToken,
  parseCookies,
  setCookie,
  slugify,
  uniqueSlug,
  SESSION_MAX_AGE_SECONDS,
};
