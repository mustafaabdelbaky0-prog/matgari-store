// admin.js — private owner dashboard at /admin.
// Access controlled by ADMIN_TOKEN env var + a signed cookie set on /admin/login.
// Shows merchant signups, activity counts, and the latest visitor feedback.

const crypto = require('crypto');
const { query, queryOne } = require('../lib/db');
const { parseBody } = require('../lib/body');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseCookies } = require('../lib/auth');

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function tokenHash() {
  const t = process.env.ADMIN_TOKEN || '';
  if (!t) return null;
  return crypto.createHash('sha256').update(t).digest('hex');
}

function isAuthed(req) {
  const expected = tokenHash();
  if (!expected) return false;
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] === expected;
}

function setAuthCookie(res) {
  const val = tokenHash();
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${val}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--ink:#0F172A;--ink-2:#475569;--line:#E2E8F0;--brand:#4F46E5;--bg:#F8FAFC;--card:#fff;--danger:#DC2626;--success:#10B981}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Cairo',sans-serif;background:var(--bg);color:var(--ink);line-height:1.6}
  .wrap{max-width:1200px;margin:0 auto;padding:24px 20px}
  header{background:#0F172A;color:#fff;padding:16px 0}
  .h-inner{max-width:1200px;margin:0 auto;padding:0 20px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  .h-inner h1{margin:0;font-size:20px;font-weight:800}
  .h-inner a{color:#94A3B8;text-decoration:none;font-size:13px;font-weight:600}
  .h-inner a:hover{color:#fff}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}
  @media (max-width:800px){.stats{grid-template-columns:repeat(2,1fr)}}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
  .stat .n{font-size:30px;font-weight:800;color:var(--brand);line-height:1}
  .stat .l{font-size:13px;color:var(--ink-2);margin-top:6px}
  .stat.g .n{color:var(--success)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:22px}
  .card h2{margin:0 0 16px;font-size:17px;font-weight:800;padding-bottom:12px;border-bottom:1px solid var(--line)}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{padding:10px 8px;text-align:right;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:#F1F5F9;font-weight:700;color:var(--ink-2);font-size:12px;text-transform:uppercase;letter-spacing:.05em}
  td.mono{font-family:monospace;direction:ltr;text-align:left;color:var(--ink-2);font-size:12.5px}
  .tag{display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700}
  .tag.ai{background:#EEF2FF;color:#4338CA}
  .tag.des{background:#FCE7F3;color:#BE185D}
  .tag.gen{background:#F3F4F6;color:#374151}
  a.store-link{color:var(--brand);text-decoration:none;font-weight:600}
  a.store-link:hover{text-decoration:underline}
  .msg{max-width:520px;white-space:pre-wrap;line-height:1.55}
  .empty{color:var(--ink-2);text-align:center;padding:24px;font-size:14px}
  .login-box{max-width:400px;margin:80px auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:32px}
  .login-box h1{margin:0 0 8px;font-size:22px}
  .login-box p{color:var(--ink-2);font-size:14px;margin:0 0 20px}
  .login-box input{width:100%;padding:12px 14px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:15px;margin-bottom:14px}
  .login-box button{width:100%;background:var(--brand);color:#fff;border:none;padding:12px;border-radius:10px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .err{background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;padding:10px 12px;border-radius:8px;font-size:14px;margin-bottom:14px}
</style></head><body>${body}</body></html>`;
}

function loginPage(error) {
  return layout('Admin Login', `<div class="login-box">
    <h1>🔐 دخول الأدمن</h1>
    <p>ادخل التوكن السري</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <form method="POST" action="/admin/login">
      <input type="password" name="token" placeholder="ADMIN_TOKEN" autofocus required>
      <button type="submit">دخول</button>
    </form>
  </div>`);
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

async function dashboardPage(host) {
  const [
    merchantsCount, onboardedCount, productsCount, salesCount,
    feedbackCount, aiChatCount, last7DaysMerchants,
  ] = await Promise.all([
    queryOne('SELECT COUNT(*)::int AS n FROM merchants'),
    queryOne('SELECT COUNT(*)::int AS n FROM merchants WHERE onboarded = 1'),
    queryOne('SELECT COUNT(*)::int AS n FROM products'),
    queryOne("SELECT COUNT(*)::int AS n FROM transactions WHERE type = 'sale'"),
    queryOne('SELECT COUNT(*)::int AS n FROM feedback'),
    queryOne("SELECT COUNT(*)::int AS n FROM feedback WHERE type = 'ai_chat'"),
    queryOne("SELECT COUNT(*)::int AS n FROM merchants WHERE created_at > NOW() - INTERVAL '7 days'"),
  ]);

  const merchants = await query(`
    SELECT m.id, m.name, m.phone, m.store_name, m.slug, m.category, m.onboarded, m.created_at,
           (SELECT COUNT(*)::int FROM products p WHERE p.merchant_id = m.id) AS products,
           (SELECT COUNT(*)::int FROM transactions t WHERE t.merchant_id = m.id AND t.type = 'sale') AS sales
    FROM merchants m ORDER BY m.created_at DESC LIMIT 50
  `);

  const feedback = await query(`
    SELECT id, type, contact, message, source_ip, created_at
    FROM feedback ORDER BY created_at DESC LIMIT 30
  `);

  const tagFor = (t) => {
    if (t === 'ai_chat') return '<span class="tag ai">AI Chat</span>';
    if (t === 'design_suggestion') return '<span class="tag des">Design</span>';
    return `<span class="tag gen">${esc(t)}</span>`;
  };

  const merchantRows = merchants.length ? merchants.map((m) => `
    <tr>
      <td><strong>${esc(m.name)}</strong><br><span style="font-size:12px;color:#64748B">${esc(m.phone)}</span></td>
      <td>
        <a class="store-link" href="/store/${esc(m.slug)}" target="_blank">${esc(m.store_name)}</a>
        <br><span style="font-size:11.5px;color:#64748B">${esc(m.category || '—')}</span>
      </td>
      <td>${m.onboarded === 1 ? '✅' : '⏳'}</td>
      <td style="text-align:center">${m.products}</td>
      <td style="text-align:center">${m.sales}</td>
      <td class="mono">${fmtDate(m.created_at)}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">لسه مفيش تجار مسجلين</td></tr>';

  const feedbackRows = feedback.length ? feedback.map((f) => `
    <tr>
      <td>${tagFor(f.type)}</td>
      <td class="msg">${esc(f.message)}</td>
      <td>${esc(f.contact || '—')}</td>
      <td class="mono">${esc(f.source_ip || '—')}</td>
      <td class="mono">${fmtDate(f.created_at)}</td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">لسه مفيش رسايل</td></tr>';

  return layout('Admin Dashboard', `
    <header><div class="h-inner">
      <h1>🎛️ Admin Dashboard — متجري</h1>
      <a href="/admin/logout">خروج</a>
    </div></header>
    <div class="wrap">
      <div class="stats">
        <div class="stat"><div class="n">${merchantsCount.n}</div><div class="l">إجمالي التجار</div></div>
        <div class="stat g"><div class="n">${onboardedCount.n}</div><div class="l">تجار كمّلوا Onboarding</div></div>
        <div class="stat"><div class="n">${last7DaysMerchants.n}</div><div class="l">جدد آخر 7 أيام</div></div>
        <div class="stat"><div class="n">${productsCount.n}</div><div class="l">إجمالي المنتجات</div></div>
        <div class="stat"><div class="n">${salesCount.n}</div><div class="l">فواتير مبيعات</div></div>
        <div class="stat"><div class="n">${feedbackCount.n}</div><div class="l">رسايل الزوار</div></div>
        <div class="stat"><div class="n">${aiChatCount.n}</div><div class="l">أسئله للـ AI</div></div>
        <div class="stat"><div class="n">${feedbackCount.n - aiChatCount.n}</div><div class="l">اقتراحات</div></div>
      </div>

      <div class="card">
        <h2>آخر التجار المسجلين (${merchants.length})</h2>
        <table>
          <thead><tr>
            <th>التاجر</th><th>المتجر</th><th>Onboarded</th>
            <th>منتجات</th><th>مبيعات</th><th>تاريخ التسجيل</th>
          </tr></thead>
          <tbody>${merchantRows}</tbody>
        </table>
      </div>

      <div class="card">
        <h2>رسايل الزوار من اللاندج بيدج (آخر ${feedback.length})</h2>
        <table>
          <thead><tr>
            <th>النوع</th><th>الرساله</th><th>الاتصال</th><th>IP</th><th>الوقت</th>
          </tr></thead>
          <tbody>${feedbackRows}</tbody>
        </table>
      </div>
    </div>`);
}

function registerRoutes(router) {
  router.get('/admin/login', (req, res) => {
    if (!process.env.ADMIN_TOKEN) {
      return sendHtml(res, 503, layout('Admin Not Configured',
        `<div class="login-box"><h1>⚠️ Admin غير مفعّل</h1><p>محتاج تضيف <code>ADMIN_TOKEN</code> في Vercel Env Vars.</p></div>`));
    }
    if (isAuthed(req)) return redirect(res, '/admin');
    sendHtml(res, 200, loginPage(null));
  });

  router.post('/admin/login', async (req, res) => {
    const b = await parseBody(req);
    const token = (b.token || '').trim();
    if (!process.env.ADMIN_TOKEN) return sendHtml(res, 503, loginPage('Admin غير مفعّل'));
    if (token !== process.env.ADMIN_TOKEN) {
      return sendHtml(res, 401, loginPage('التوكن غلط'));
    }
    setAuthCookie(res);
    redirect(res, '/admin');
  });

  router.get('/admin/logout', (req, res) => {
    clearAuthCookie(res);
    redirect(res, '/admin/login');
  });

  router.get('/admin', async (req, res) => {
    if (!isAuthed(req)) return redirect(res, '/admin/login');
    try {
      const html = await dashboardPage(req.headers.host || '');
      sendHtml(res, 200, html);
    } catch (err) {
      console.error('[admin dashboard]', err);
      sendHtml(res, 500, layout('Error', `<div class="wrap"><div class="card"><h2>حصل خطأ</h2><pre style="white-space:pre-wrap">${esc(err.message)}</pre></div></div>`));
    }
  });
}

module.exports = { registerRoutes };
