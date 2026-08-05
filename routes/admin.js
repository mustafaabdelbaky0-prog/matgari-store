// admin.js — private owner dashboard at /admin.
// Access controlled by ADMIN_TOKEN env var + a signed cookie set on /admin/login.
//
// Routes:
//   GET  /admin                       — dashboard: stats + expiring-soon + merchants table + feedback
//   GET  /admin/merchant/:id          — merchant detail: profile + products + transactions
//   POST /admin/merchant/:id/action   — extend | cancel | activate | delete
//   GET  /admin/login  POST /admin/login  GET /admin/logout

const crypto = require('crypto');
const { query, queryOne, exec } = require('../lib/db');
const { parseBody } = require('../lib/body');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseCookies } = require('../lib/auth');
const { daysLeft, bucket } = require('../lib/subscription');

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 12;

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
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${tokenHash()}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`);
}
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
}
function fmtMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج.م';
}

const CSS = `
  :root{--ink:#0F172A;--ink-2:#475569;--ink-3:#94A3B8;--line:#E2E8F0;--brand:#4F46E5;--brand-2:#7C3AED;--bg:#F8FAFC;--card:#fff;--danger:#DC2626;--warning:#F59E0B;--success:#10B981;--info:#0EA5E9}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Cairo',sans-serif;background:var(--bg);color:var(--ink);line-height:1.6}
  .wrap{max-width:1400px;margin:0 auto;padding:24px 20px}
  header{background:linear-gradient(135deg,#0F172A,#1E293B);color:#fff;padding:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.1)}
  .h-inner{max-width:1400px;margin:0 auto;padding:0 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .h-inner h1{margin:0;font-size:20px;font-weight:800}
  .h-inner .h-actions{display:flex;gap:14px;align-items:center}
  .h-inner a{color:#94A3B8;text-decoration:none;font-size:13px;font-weight:600}
  .h-inner a:hover{color:#fff}

  .alert-urgent{background:linear-gradient(135deg,#FEE2E2,#FEF3C7);border:2px solid #DC2626;border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
  .alert-urgent .msg{font-weight:700;color:#991B1B;font-size:15px}
  .alert-urgent .count{background:#DC2626;color:#fff;padding:4px 12px;border-radius:20px;font-weight:800;font-size:14px}

  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}
  @media (max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
  .stat .n{font-size:28px;font-weight:800;color:var(--brand);line-height:1}
  .stat .l{font-size:12.5px;color:var(--ink-2);margin-top:6px}
  .stat.g .n{color:var(--success)}
  .stat.w .n{color:var(--warning)}
  .stat.r .n{color:var(--danger)}

  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:22px;box-shadow:0 1px 3px rgba(0,0,0,.03)}
  .card h2{margin:0 0 16px;font-size:17px;font-weight:800;padding-bottom:12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
  .card h2 .count-badge{background:#EEF2FF;color:#4338CA;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}

  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{padding:10px 8px;text-align:right;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:#F1F5F9;font-weight:700;color:var(--ink-2);font-size:12px;text-transform:uppercase;letter-spacing:.05em}
  tr:hover{background:#FAFBFC}
  td.mono{font-family:monospace;direction:ltr;text-align:left;color:var(--ink-2);font-size:12.5px}
  td.center{text-align:center}

  .tag{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap}
  .tag.ai{background:#EEF2FF;color:#4338CA}
  .tag.des{background:#FCE7F3;color:#BE185D}
  .tag.gen{background:#F3F4F6;color:#374151}

  .sub-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap}
  .sub-badge.ok{background:#D1FAE5;color:#065F46}
  .sub-badge.warning{background:#FEF3C7;color:#92400E}
  .sub-badge.urgent{background:#FEE2E2;color:#991B1B}
  .sub-badge.expired{background:#F3F4F6;color:#374151}

  a.store-link{color:var(--brand);text-decoration:none;font-weight:600}
  a.store-link:hover{text-decoration:underline}
  a.merchant-link{color:var(--ink);text-decoration:none;font-weight:700}
  a.merchant-link:hover{color:var(--brand)}

  .btn{display:inline-block;padding:6px 12px;border-radius:8px;font-size:12.5px;font-weight:700;border:none;cursor:pointer;font-family:inherit;text-decoration:none;text-align:center}
  .btn-p{background:var(--brand);color:#fff}
  .btn-p:hover{background:var(--brand-2)}
  .btn-s{background:#F1F5F9;color:var(--ink)}
  .btn-s:hover{background:#E2E8F0}
  .btn-g{background:var(--success);color:#fff}
  .btn-w{background:var(--warning);color:#fff}
  .btn-d{background:var(--danger);color:#fff}
  .btn-sm{padding:5px 10px;font-size:11.5px}

  .msg{max-width:520px;white-space:pre-wrap;line-height:1.55}
  .empty{color:var(--ink-2);text-align:center;padding:24px;font-size:14px}
  .link-copy{display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;padding:4px 10px;border-radius:6px;font-size:11.5px;direction:ltr;font-family:monospace;color:var(--ink-2);text-decoration:none;cursor:pointer;border:1px solid var(--line);margin-top:4px}
  .link-copy:hover{background:#E2E8F0;color:var(--brand)}

  .search-bar{display:flex;gap:8px;margin-bottom:14px}
  .search-bar input{flex:1;padding:9px 12px;border:1.5px solid var(--line);border-radius:8px;font-family:inherit;font-size:14px}

  /* Login */
  .login-box{max-width:400px;margin:80px auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:32px}
  .login-box h1{margin:0 0 8px;font-size:22px}
  .login-box p{color:var(--ink-2);font-size:14px;margin:0 0 20px}
  .login-box input{width:100%;padding:12px 14px;border:1.5px solid var(--line);border-radius:10px;font-family:inherit;font-size:15px;margin-bottom:14px}
  .login-box button{width:100%;background:var(--brand);color:#fff;border:none;padding:12px;border-radius:10px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .err{background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;padding:10px 12px;border-radius:8px;font-size:14px;margin-bottom:14px}

  /* Detail page */
  .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
  @media (max-width:900px){.detail-grid{grid-template-columns:1fr}}
  .info-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed var(--line);font-size:14px}
  .info-row:last-child{border-bottom:none}
  .info-row .k{color:var(--ink-2);font-weight:600}
  .info-row .v{color:var(--ink);font-weight:600;text-align:end}
  .actions-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}
  .back-link{color:var(--brand);text-decoration:none;font-weight:700;font-size:14px;display:inline-block;margin-bottom:16px}
`;

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${body}
<script>
function copyLink(el, url){
  navigator.clipboard.writeText(url).then(()=>{
    const orig = el.innerHTML;
    el.innerHTML = '✓ اتنسخ';
    setTimeout(()=>{ el.innerHTML = orig; }, 1400);
  });
}
function confirmAction(msg){ return confirm(msg); }
</script>
</body></html>`;
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

function subBadge(merchant) {
  const b = bucket(merchant);
  const dl = daysLeft(merchant.subscription_expires_at);
  const label = {
    ok: `✅ فعّال · ${dl} يوم`,
    warning: `⚠️ باقي ${dl} يوم`,
    urgent: `🔥 باقي ${dl} يوم`,
    expired: merchant.subscription_status === 'cancelled' ? '❌ ملغي' : '⛔ منتهي',
  }[b];
  return `<span class="sub-badge ${b}">${label}</span>`;
}

function planTag(plan) {
  const m = { trial: 'تجريبي', basic: 'أساسي', pro: 'برو' };
  return `<span style="font-size:11px;color:#64748B;font-weight:600">${m[plan] || plan}</span>`;
}

function storeLinkHtml(host, slug) {
  const proto = host && host.includes('localhost') ? 'http' : 'https';
  const url = `${proto}://${host}/store/${slug}`;
  return `<a class="store-link" href="/store/${esc(slug)}" target="_blank">/store/${esc(slug)}</a>
    <div><a class="link-copy" onclick="copyLink(this, '${url}')">📋 نسخ اللينك الكامل</a></div>`;
}

async function dashboardPage(host) {
  const [counts, expSoon] = await Promise.all([
    queryOne(`SELECT
      (SELECT COUNT(*)::int FROM merchants) AS merchants,
      (SELECT COUNT(*)::int FROM merchants WHERE onboarded = 1) AS onboarded,
      (SELECT COUNT(*)::int FROM merchants WHERE created_at > NOW() - INTERVAL '7 days') AS new_week,
      (SELECT COUNT(*)::int FROM merchants WHERE subscription_status IN ('trial','active') AND subscription_expires_at > NOW()) AS active_subs,
      (SELECT COUNT(*)::int FROM merchants WHERE subscription_expires_at <= NOW() + INTERVAL '3 days' AND subscription_expires_at > NOW() AND subscription_status IN ('trial','active')) AS expiring_3d,
      (SELECT COUNT(*)::int FROM merchants WHERE subscription_expires_at <= NOW() OR subscription_status IN ('expired','cancelled')) AS expired,
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM transactions WHERE type = 'sale') AS sales,
      (SELECT COUNT(*)::int FROM feedback) AS feedback,
      (SELECT COUNT(*)::int FROM feedback WHERE type = 'ai_chat') AS ai_chats
    `),
    query(`SELECT id, name, phone, store_name, slug, subscription_status, subscription_expires_at
           FROM merchants
           WHERE subscription_status IN ('trial','active')
             AND subscription_expires_at <= NOW() + INTERVAL '3 days'
             AND subscription_expires_at > NOW()
           ORDER BY subscription_expires_at ASC`),
  ]);

  const merchants = await query(`
    SELECT m.id, m.name, m.phone, m.store_name, m.slug, m.category, m.whatsapp,
           m.onboarded, m.created_at,
           m.subscription_status, m.subscription_plan, m.subscription_expires_at,
           (SELECT COUNT(*)::int FROM products p WHERE p.merchant_id = m.id) AS products,
           (SELECT COUNT(*)::int FROM transactions t WHERE t.merchant_id = m.id AND t.type = 'sale') AS sales
    FROM merchants m ORDER BY m.created_at DESC LIMIT 100
  `);

  const feedback = await query(`SELECT id, type, contact, message, source_ip, created_at
                                FROM feedback ORDER BY created_at DESC LIMIT 30`);

  const tagFor = (t) => {
    if (t === 'ai_chat') return '<span class="tag ai">AI</span>';
    if (t === 'design_suggestion') return '<span class="tag des">تصميم</span>';
    return `<span class="tag gen">${esc(t)}</span>`;
  };

  const expSoonBanner = expSoon.length > 0 ? `
    <div class="alert-urgent">
      <div>
        <div class="msg">🚨 في <span class="count">${expSoon.length}</span> تاجر اشتراكه هيخلص خلال 3 أيام</div>
        <div style="font-size:13px;color:#78350F;margin-top:6px">
          ${expSoon.slice(0, 4).map((m) => `<strong>${esc(m.name)}</strong> (${esc(m.store_name)}) — باقي ${daysLeft(m.subscription_expires_at)} يوم`).join(' · ')}
          ${expSoon.length > 4 ? ` +${expSoon.length - 4} تاني` : ''}
        </div>
      </div>
    </div>` : '';

  const merchantRows = merchants.length ? merchants.map((m) => `
    <tr>
      <td>
        <a class="merchant-link" href="/admin/merchant/${m.id}">${esc(m.name)}</a>
        <div style="font-size:12px;color:#64748B;margin-top:2px">📞 ${esc(m.phone)}</div>
        ${m.whatsapp ? `<div style="font-size:11.5px;color:#25D366;margin-top:2px">📱 ${esc(m.whatsapp)}</div>` : ''}
      </td>
      <td>
        <strong>${esc(m.store_name)}</strong>
        <div style="font-size:11.5px;color:#64748B">${esc(m.category || 'مش مختار')}</div>
        <div style="margin-top:6px">${storeLinkHtml(host, m.slug)}</div>
      </td>
      <td class="center">${m.onboarded === 1 ? '✅' : '⏳'}</td>
      <td>
        ${subBadge(m)}<br>
        ${planTag(m.subscription_plan)}<br>
        <span style="font-size:11px;color:#64748B">ينتهي: ${fmtDateShort(m.subscription_expires_at)}</span>
      </td>
      <td class="center"><strong>${m.products}</strong></td>
      <td class="center"><strong>${m.sales}</strong></td>
      <td class="mono" style="font-size:11px">${fmtDate(m.created_at)}</td>
      <td>
        <a class="btn btn-p btn-sm" href="/admin/merchant/${m.id}">تفاصيل</a>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty">لسه مفيش تجار</td></tr>';

  const feedbackRows = feedback.length ? feedback.map((f) => `
    <tr>
      <td>${tagFor(f.type)}</td>
      <td class="msg">${esc(f.message)}</td>
      <td>${esc(f.contact || '—')}</td>
      <td class="mono">${esc(f.source_ip || '—')}</td>
      <td class="mono" style="font-size:11px">${fmtDate(f.created_at)}</td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">لسه مفيش رسايل</td></tr>';

  return layout('Admin Dashboard', `
    <header><div class="h-inner">
      <h1>🎛️ Admin — متجري</h1>
      <div class="h-actions">
        <a href="/admin">🔄 تحديث</a>
        <a href="/admin/logout">خروج</a>
      </div>
    </div></header>
    <div class="wrap">
      ${expSoonBanner}

      <div class="stats">
        <div class="stat"><div class="n">${counts.merchants}</div><div class="l">إجمالي التجار</div></div>
        <div class="stat g"><div class="n">${counts.active_subs}</div><div class="l">اشتراكات فعّاله</div></div>
        <div class="stat r"><div class="n">${counts.expired}</div><div class="l">اشتراكات منتهيه</div></div>
        <div class="stat w"><div class="n">${counts.expiring_3d}</div><div class="l">بيخلصوا خلال 3 أيام</div></div>
        <div class="stat"><div class="n">${counts.new_week}</div><div class="l">جدد آخر 7 أيام</div></div>
        <div class="stat"><div class="n">${counts.products}</div><div class="l">إجمالي المنتجات</div></div>
        <div class="stat"><div class="n">${counts.sales}</div><div class="l">فواتير مبيعات</div></div>
        <div class="stat"><div class="n">${counts.ai_chats}/${counts.feedback}</div><div class="l">أسئله AI / كل الرسايل</div></div>
      </div>

      <div class="card">
        <h2>👥 التجار <span class="count-badge">${merchants.length}</span></h2>
        <div class="search-bar">
          <input type="text" id="mSearch" placeholder="🔍 بحث بالاسم / التليفون / اسم المتجر…" oninput="filterMerchants(this.value)">
        </div>
        <div style="overflow-x:auto">
        <table id="mTable">
          <thead><tr>
            <th>التاجر</th><th>المتجر واللينك</th><th>Onboard</th>
            <th>الاشتراك</th><th>منتجات</th><th>مبيعات</th><th>تسجيل</th><th>—</th>
          </tr></thead>
          <tbody>${merchantRows}</tbody>
        </table>
        </div>
      </div>

      <div class="card">
        <h2>💬 رسايل الزوار من اللاندج بيدج <span class="count-badge">${feedback.length}</span></h2>
        <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>النوع</th><th>الرساله</th><th>الاتصال</th><th>IP</th><th>الوقت</th>
          </tr></thead>
          <tbody>${feedbackRows}</tbody>
        </table>
        </div>
      </div>
    </div>
    <script>
      function filterMerchants(q){
        const query = q.trim().toLowerCase();
        const rows = document.querySelectorAll('#mTable tbody tr');
        rows.forEach(r => {
          const t = r.textContent.toLowerCase();
          r.style.display = t.includes(query) ? '' : 'none';
        });
      }
    </script>`);
}

async function merchantDetailPage(id, host, notice) {
  const m = await queryOne(`SELECT * FROM merchants WHERE id = $1`, [id]);
  if (!m) return null;
  const [products, transactions, feedbackCount] = await Promise.all([
    query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [id]),
    query('SELECT * FROM transactions WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 50', [id]),
    queryOne('SELECT COUNT(*)::int AS n FROM sessions WHERE merchant_id = $1', [id]),
  ]);

  const totalSales = transactions.filter((t) => t.type === 'sale').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalPurch = transactions.filter((t) => t.type === 'purchase').reduce((s, t) => s + Number(t.amount || 0), 0);

  const dl = daysLeft(m.subscription_expires_at);
  const proto = host && host.includes('localhost') ? 'http' : 'https';
  const fullStoreUrl = `${proto}://${host}/store/${m.slug}`;

  const productRows = products.length ? products.map((p) => `
    <tr>
      <td><strong>${esc(p.name)}</strong>${p.description ? `<div style="font-size:12px;color:#64748B;margin-top:2px">${esc(p.description).slice(0, 80)}</div>` : ''}</td>
      <td class="center">${fmtMoney(p.cost_price)}</td>
      <td class="center">${fmtMoney(p.sell_price)}</td>
      <td class="center"><strong>${p.quantity}</strong></td>
      <td class="center">${p.visible === 1 ? '👁' : '🚫'}</td>
      <td class="mono" style="font-size:11px">${fmtDate(p.created_at)}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">مفيش منتجات</td></tr>';

  const txnRows = transactions.length ? transactions.map((t) => {
    const typeMap = {
      sale: '<span class="tag" style="background:#D1FAE5;color:#065F46">بيع</span>',
      purchase: '<span class="tag" style="background:#DBEAFE;color:#1E40AF">شراء</span>',
      income: '<span class="tag" style="background:#FEF3C7;color:#92400E">إيراد</span>',
      expense: '<span class="tag" style="background:#FEE2E2;color:#991B1B">مصروف</span>',
    };
    return `<tr>
      <td>${typeMap[t.type] || esc(t.type)}</td>
      <td>${esc(t.product_name || t.note || '—')}</td>
      <td class="center">${t.quantity || '—'}</td>
      <td class="center"><strong>${fmtMoney(t.amount)}</strong></td>
      <td class="mono" style="font-size:11px">${fmtDate(t.created_at)}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="5" class="empty">مفيش معاملات</td></tr>';

  const sectionsList = Array.isArray(m.sections) && m.sections.length
    ? m.sections.map((s) => `<span style="display:inline-block;background:#EEF2FF;color:#4338CA;padding:3px 10px;border-radius:12px;font-size:12px;margin:2px">${esc(s.name || s)}</span>`).join('')
    : '<span style="color:#94A3B8">مفيش أقسام</span>';

  return layout(`تفاصيل: ${m.name}`, `
    <header><div class="h-inner">
      <h1>👤 ${esc(m.name)} — ${esc(m.store_name)}</h1>
      <div class="h-actions"><a href="/admin">← الرجوع للداشبورد</a></div>
    </div></header>
    <div class="wrap">
      ${notice ? `<div class="alert-urgent" style="background:#D1FAE5;border-color:#10B981"><div class="msg" style="color:#065F46">✅ ${esc(notice)}</div></div>` : ''}

      <div class="detail-grid">
        <div class="card">
          <h2>معلومات الحساب</h2>
          <div class="info-row"><span class="k">الاسم</span><span class="v">${esc(m.name)}</span></div>
          <div class="info-row"><span class="k">تليفون</span><span class="v" style="direction:ltr">${esc(m.phone)}</span></div>
          <div class="info-row"><span class="k">اسم المتجر</span><span class="v">${esc(m.store_name)}</span></div>
          <div class="info-row"><span class="k">المجال</span><span class="v">${esc(m.category || 'مش مختار')}</span></div>
          <div class="info-row"><span class="k">واتساب</span><span class="v" style="direction:ltr">${esc(m.whatsapp || '—')}</span></div>
          <div class="info-row"><span class="k">Onboarded</span><span class="v">${m.onboarded === 1 ? '✅ نعم' : '⏳ لسه'}</span></div>
          <div class="info-row"><span class="k">تاريخ التسجيل</span><span class="v">${fmtDate(m.created_at)}</span></div>
          <div class="info-row"><span class="k">جلسات دخول نشطه</span><span class="v">${feedbackCount.n}</span></div>
          <div class="info-row"><span class="k">أقسام مخصوصه</span><span class="v" style="text-align:left">${sectionsList}</span></div>

          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">
            <strong style="display:block;margin-bottom:8px">🔗 لينك المتجر:</strong>
            <a class="store-link" href="/store/${esc(m.slug)}" target="_blank">${esc(fullStoreUrl)}</a>
            <div><a class="link-copy" onclick="copyLink(this, '${fullStoreUrl}')">📋 نسخ اللينك الكامل</a></div>
          </div>
        </div>

        <div class="card">
          <h2>حاله الاشتراك</h2>
          <div class="info-row"><span class="k">الحاله</span><span class="v">${subBadge(m)}</span></div>
          <div class="info-row"><span class="k">الخطه</span><span class="v">${planTag(m.subscription_plan)}</span></div>
          <div class="info-row"><span class="k">ينتهي في</span><span class="v">${fmtDate(m.subscription_expires_at)}</span></div>
          <div class="info-row"><span class="k">الأيام المتبقيه</span><span class="v" style="font-size:18px;color:${dl <= 3 ? '#DC2626' : (dl <= 7 ? '#F59E0B' : '#10B981')}">${dl > 0 ? dl + ' يوم' : 'منتهي'}</span></div>
          ${m.subscription_notes ? `<div class="info-row"><span class="k">ملاحظات</span><span class="v">${esc(m.subscription_notes)}</span></div>` : ''}

          <div class="actions-row">
            <form method="POST" action="/admin/merchant/${m.id}/action" style="display:inline">
              <input type="hidden" name="action" value="extend_30">
              <button class="btn btn-g" type="submit">+30 يوم</button>
            </form>
            <form method="POST" action="/admin/merchant/${m.id}/action" style="display:inline">
              <input type="hidden" name="action" value="extend_90">
              <button class="btn btn-g" type="submit">+90 يوم</button>
            </form>
            <form method="POST" action="/admin/merchant/${m.id}/action" style="display:inline">
              <input type="hidden" name="action" value="extend_365">
              <button class="btn btn-g" type="submit">+سنه</button>
            </form>
            <form method="POST" action="/admin/merchant/${m.id}/action" style="display:inline" onsubmit="return confirmAction('متأكد إنك عاوز تلغي الاشتراك؟')">
              <input type="hidden" name="action" value="cancel">
              <button class="btn btn-w" type="submit">إلغاء الاشتراك</button>
            </form>
            <form method="POST" action="/admin/merchant/${m.id}/action" style="display:inline">
              <input type="hidden" name="action" value="activate">
              <button class="btn btn-s" type="submit">تفعيل</button>
            </form>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="card" style="background:#F0FDF4">
          <h2 style="color:#166534">💰 إجمالي المبيعات</h2>
          <div style="font-size:28px;font-weight:800;color:#15803D">${fmtMoney(totalSales)}</div>
          <div style="color:#166534;margin-top:6px;font-size:13px">${transactions.filter((t) => t.type === 'sale').length} فاتوره</div>
        </div>
        <div class="card" style="background:#EFF6FF">
          <h2 style="color:#1E40AF">📦 إجمالي المشتريات</h2>
          <div style="font-size:28px;font-weight:800;color:#1D4ED8">${fmtMoney(totalPurch)}</div>
          <div style="color:#1E40AF;margin-top:6px;font-size:13px">${transactions.filter((t) => t.type === 'purchase').length} فاتوره</div>
        </div>
      </div>

      <div class="card">
        <h2>📦 المنتجات <span class="count-badge">${products.length}</span></h2>
        <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>المنتج</th><th>سعر الشراء</th><th>سعر البيع</th><th>الكميه</th><th>ظاهر</th><th>تاريخ الإضافه</th>
          </tr></thead>
          <tbody>${productRows}</tbody>
        </table>
        </div>
      </div>

      <div class="card">
        <h2>💵 آخر 50 معامله ماليه</h2>
        <div style="overflow-x:auto">
        <table>
          <thead><tr><th>النوع</th><th>الوصف</th><th>الكميه</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
          <tbody>${txnRows}</tbody>
        </table>
        </div>
      </div>

      <div class="card" style="background:#FEF2F2;border-color:#FECACA">
        <h2 style="color:#991B1B">⚠️ منطقه الخطر</h2>
        <form method="POST" action="/admin/merchant/${m.id}/action" onsubmit="return confirmAction('حذف الحساب نهائيًا؟ ده هيمسح كل بيانات التاجر والمنتجات والفواتير. مش هينفع الرجوع!')">
          <input type="hidden" name="action" value="delete">
          <button class="btn btn-d" type="submit">🗑️ حذف حساب التاجر نهائيًا</button>
        </form>
      </div>
    </div>`);
}

function registerRoutes(router) {
  router.get('/admin/login', (req, res) => {
    if (!process.env.ADMIN_TOKEN) {
      return sendHtml(res, 503, layout('Not Configured',
        `<div class="login-box"><h1>⚠️ Admin غير مفعّل</h1><p>محتاج تضيف <code>ADMIN_TOKEN</code> في Vercel Env Vars.</p></div>`));
    }
    if (isAuthed(req)) return redirect(res, '/admin');
    sendHtml(res, 200, loginPage(null));
  });

  router.post('/admin/login', async (req, res) => {
    const b = await parseBody(req);
    const token = (b.token || '').trim();
    if (!process.env.ADMIN_TOKEN) return sendHtml(res, 503, loginPage('Admin غير مفعّل'));
    if (token !== process.env.ADMIN_TOKEN) return sendHtml(res, 401, loginPage('التوكن غلط'));
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
      sendHtml(res, 200, await dashboardPage(req.headers.host || ''));
    } catch (err) {
      console.error('[admin]', err);
      sendHtml(res, 500, layout('Error', `<div class="wrap"><div class="card"><h2>حصل خطأ</h2><pre style="white-space:pre-wrap">${esc(err.message)}</pre></div></div>`));
    }
  });

  router.get('/admin/merchant/:id', async (req, res, params) => {
    if (!isAuthed(req)) return redirect(res, '/admin/login');
    try {
      const html = await merchantDetailPage(Number(params.id), req.headers.host || '', null);
      if (!html) return sendHtml(res, 404, layout('Not Found', '<div class="wrap"><div class="card">التاجر مش موجود</div></div>'));
      sendHtml(res, 200, html);
    } catch (err) {
      console.error('[admin detail]', err);
      sendHtml(res, 500, layout('Error', `<div class="wrap"><div class="card"><pre>${esc(err.message)}</pre></div></div>`));
    }
  });

  router.post('/admin/merchant/:id/action', async (req, res, params) => {
    if (!isAuthed(req)) return redirect(res, '/admin/login');
    try {
      const b = await parseBody(req);
      const id = Number(params.id);
      const action = String(b.action || '');
      let notice = '';
      if (action === 'extend_30' || action === 'extend_90' || action === 'extend_365') {
        const days = { extend_30: 30, extend_90: 90, extend_365: 365 }[action];
        await exec(
          `UPDATE merchants SET
             subscription_expires_at = GREATEST(COALESCE(subscription_expires_at, NOW()), NOW()) + ($1 || ' days')::interval,
             subscription_status = CASE WHEN subscription_status IN ('expired','cancelled') THEN 'active' ELSE subscription_status END
           WHERE id = $2`,
          [String(days), id]
        );
        notice = `تم تمديد الاشتراك +${days} يوم`;
      } else if (action === 'cancel') {
        await exec(`UPDATE merchants SET subscription_status = 'cancelled' WHERE id = $1`, [id]);
        notice = 'تم إلغاء الاشتراك';
      } else if (action === 'activate') {
        await exec(`UPDATE merchants SET subscription_status = 'active',
          subscription_expires_at = GREATEST(COALESCE(subscription_expires_at, NOW()), NOW() + INTERVAL '1 day')
          WHERE id = $1`, [id]);
        notice = 'تم تفعيل الاشتراك';
      } else if (action === 'delete') {
        await exec(`DELETE FROM merchants WHERE id = $1`, [id]);
        return redirect(res, '/admin');
      } else {
        return redirect(res, `/admin/merchant/${id}`);
      }
      const html = await merchantDetailPage(id, req.headers.host || '', notice);
      sendHtml(res, 200, html);
    } catch (err) {
      console.error('[admin action]', err);
      sendHtml(res, 500, layout('Error', `<div class="wrap"><div class="card"><pre>${esc(err.message)}</pre></div></div>`));
    }
  });
}

module.exports = { registerRoutes };
