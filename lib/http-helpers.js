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
  res.statusCode = 302;
  res.end();
}

module.exports = { sendHtml, sendJson, redirect };
