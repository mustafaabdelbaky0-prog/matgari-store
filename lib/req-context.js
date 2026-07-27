// req-context.js — resolve the current merchant on demand by re-reading the
// session cookie. Vercel's runtime doesn't reliably preserve our middleware's
// context (assigned req properties get stripped, ALS instances aren't shared
// as expected across bundled modules), so each route just asks fresh. The
// underlying query is a single indexed JOIN on the sessions/merchants tables.

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  if (!header) return {};
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

async function getRequestMerchant(req) {
  const { getMerchantFromToken } = require('./auth');
  const cookies = parseCookies(req);
  const result = await getMerchantFromToken(cookies.session);
  console.log('[getRequestMerchant] cookie?', !!cookies.session, 'result?', result ? result.id : 'null');
  return result;
}

// No-op for compatibility; kept so middleware calls don't break during
// migration but the source of truth is always a fresh cookie lookup.
function setRequestMerchant(_req, _merchant) {}
function runWithContext(_ctx, fn) { return fn(); }

module.exports = { getRequestMerchant, setRequestMerchant, runWithContext };
