// auth.js — تسجيل الدخول والجلسات (بدون أي مكتبات خارجية)
const crypto = require('crypto');
const db = require('./db');

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

function createSession(merchantId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, merchant_id) VALUES (?, ?)').run(token, merchantId);
  return token;
}

function destroySession(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function getMerchantFromToken(token) {
  if (!token) return null;
  const row = db.prepare(
    `SELECT m.* FROM sessions s JOIN merchants m ON m.id = s.merchant_id WHERE s.token = ?`
  ).get(token);
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
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
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
    .replace(/[ً-ْ]/g, '') // remove Arabic diacritics
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) s = ARABIC_TO_LATIN_FALLBACK;
  return s;
}

function uniqueSlug(base) {
  let slug = slugify(base);
  let candidate = slug;
  let i = 1;
  const exists = (s) => db.prepare('SELECT id FROM merchants WHERE slug = ?').get(s);
  while (exists(candidate)) {
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
};
