// http-helpers.js — أدوات مساعدة للرد على الطلبات
function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function redirect(res, location) {
  // Preserve any headers already set (Set-Cookie etc.) — do NOT pass a headers
  // object to writeHead, that would replace them.
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.statusCode = 302;
  res.end();
}

// Best-effort client IP — Vercel (and most proxies) set x-forwarded-for as
// "client, proxy1, proxy2"; the first entry is the original client.
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

module.exports = { sendHtml, sendJson, redirect, getClientIp };
