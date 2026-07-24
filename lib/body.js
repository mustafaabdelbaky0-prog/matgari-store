// body.js — قراءة جسم الطلب (urlencoded / JSON) بدون مكتبات خارجية
const querystring = require('querystring');

const MAX_BODY = 12 * 1024 * 1024; // 12MB (كافية لصورة منتج واحدة base64)

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseBody(req) {
  const raw = await readRawBody(req);
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  return querystring.parse(raw);
}

module.exports = { parseBody };
