// req-context.js — WeakMap-backed per-request context.
// Vercel's request wrapper drops arbitrary own properties (they survive as
// enumerable keys but the value becomes `{}` when serialized), so anything we
// stash on `req` directly can silently disappear. Route through this module
// instead.

const store = new WeakMap();

function setRequestMerchant(req, merchant) {
  store.set(req, { merchant });
}

function getRequestMerchant(req) {
  const rec = store.get(req);
  return rec ? rec.merchant : null;
}

module.exports = { setRequestMerchant, getRequestMerchant };
