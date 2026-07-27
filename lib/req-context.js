// req-context.js — request-scoped storage using AsyncLocalStorage.
// Vercel's request wrapper drops arbitrary own properties on `req` (values
// silently become {} or vanish), and even a WeakMap keyed on `req` misses
// across their internal wrapping. AsyncLocalStorage is the reliable way to
// pass per-request context down the async call chain.

const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

function runWithContext(ctx, fn) {
  return als.run(ctx, fn);
}

function getRequestMerchant(_req) {
  const store = als.getStore();
  return store ? store.merchant : null;
}

function setRequestMerchant(_req, merchant) {
  const store = als.getStore();
  if (store) store.merchant = merchant;
}

module.exports = { runWithContext, getRequestMerchant, setRequestMerchant };
