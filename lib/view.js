// view.js — قوالب HTML بسيطة (بدون أي محرك قوالب خارجي)

const { listCategories, getCategoryConfig } = require('./category-configs');

// Categories the onboarding + settings UIs offer. Order matches importance/frequency.
const CATEGORIES = [
  ...listCategories(),
  { id: 'other', label: 'مجال تاني', emoji: '🛍️' },
];

// Suggested profit margin per category (kept for the products form default).
const CATEGORY_MARGIN = {
  kids: 80,
  men: 70,
  perfumes: 60,
  shoes: 70,
  'phone-accessories': 60,
  'women-accessories': 100,
  home: 50,
  packaging: 40,
  other: 50,
};

function suggestedMargin(category) {
  return CATEGORY_MARGIN[category] || 50;
}

function categoryLabel(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  return c ? `${c.emoji} ${c.label}` : 'متجر';
}

function categoryConfigFor(id) {
  return getCategoryConfig(id);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج.م';
}

// Safely embed a JS value as JSON inside an inline <script> tag.
// JSON.stringify does NOT escape "<", so a merchant-controlled string
// containing the literal text "</script>" would close the script block early
// and let arbitrary HTML/script run — this happens at HTML-parse time,
// before any of our JS even executes. Escaping "<" as < neutralizes
// </script>, <script>, and <!-- breakouts while keeping valid JSON semantics.
function jsonScriptSafe(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function fmtDate(s) {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' });
  } catch (e) {
    return s;
  }
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'الرئيسية', key: 'home' },
  { href: '/dashboard/products', icon: '📦', label: 'المخزون', key: 'products' },
  { href: '/dashboard/sales', icon: '🧾', label: 'المبيعات', key: 'sales' },
  { href: '/dashboard/purchases', icon: '🛒', label: 'المشتريات', key: 'purchases' },
  { href: '/dashboard/cash', icon: '💰', label: 'الخزنة', key: 'cash' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'الإعدادات', key: 'settings' },
];

function bottomNav(activeKey) {
  return `
  <nav class="bottom-nav">
    ${NAV_ITEMS.map(
      (item) => `
      <a href="${item.href}" class="${item.key === activeKey ? 'active' : ''}">
        <span class="icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`
    ).join('')}
  </nav>`;
}

function topbar(merchant, subtitle) {
  return `
  <div class="topbar">
    <div class="brand">
      <span class="logo">🛍️</span>
      <div>
        <div>${esc(merchant ? merchant.store_name : 'متجري')}</div>
        ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ''}
      </div>
    </div>
  </div>`;
}

function page({ title, body, dir = 'rtl', bodyClass = '', extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4F46E5">
<title>${esc(title)} · متجري</title>
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/style.css">
${extraHead}
</head>
<body class="${bodyClass}">
${body}
<script src="/app.js"></script>
</body>
</html>`;
}

function supportWidget() {
  return `
    <style>
      #sup-fab{position:fixed;bottom:82px;left:16px;z-index:900;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;width:56px;height:56px;border-radius:50%;box-shadow:0 8px 24px rgba(79,70,229,.4);cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;transition:transform .18s}
      #sup-fab:hover{transform:scale(1.08)}
      #sup-fab .dot{position:absolute;top:8px;right:8px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid #fff}
      #sup-panel{position:fixed;bottom:150px;left:16px;z-index:901;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 200px));background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb}
      #sup-panel.open{display:flex}
      .sup-head{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:16px;display:flex;align-items:center;gap:12px}
      .sup-head .av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:20px}
      .sup-head .info{flex:1}
      .sup-head .info b{display:block;font-size:14.5px}
      .sup-head .info span{font-size:11.5px;opacity:.9;display:flex;align-items:center;gap:5px}
      .sup-head .info span::before{content:'';width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block}
      .sup-head button{background:rgba(255,255,255,.2);color:#fff;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px}
      .sup-body{flex:1;overflow-y:auto;padding:14px;background:#f9fafb;display:flex;flex-direction:column;gap:10px}
      .sup-msg{max-width:80%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}
      .sup-msg.user{align-self:flex-end;background:#4f46e5;color:#fff;border-bottom-right-radius:4px}
      .sup-msg.bot{align-self:flex-start;background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-bottom-left-radius:4px}
      .sup-msg.error{background:#fef2f2;color:#dc2626;border-color:#fecaca}
      .sup-typing{align-self:flex-start;color:#6b7280;font-size:12.5px;font-style:italic;padding:4px 8px}
      .sup-input{padding:12px;background:#fff;border-top:1px solid #e5e7eb;display:flex;gap:8px}
      .sup-input input{flex:1;border:1.5px solid #e5e7eb;border-radius:20px;padding:9px 14px;font-family:inherit;font-size:13.5px;outline:none}
      .sup-input input:focus{border-color:#4f46e5}
      .sup-input button{background:#4f46e5;color:#fff;border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
      .sup-input button:disabled{opacity:.5;cursor:not-allowed}
    </style>

    <button id="sup-fab" onclick="supToggle()" title="الدعم الفني">💬<span class="dot"></span></button>
    <div id="sup-panel">
      <div class="sup-head">
        <div class="av">🤖</div>
        <div class="info">
          <b>مساعد متجري</b>
          <span>متصل الآن</span>
        </div>
        <button onclick="supToggle()">✕</button>
      </div>
      <div class="sup-body" id="sup-body">
        <div class="sup-msg bot">
          أهلاً! أنا مساعدك الذكي في متجري. اسألني عن أي حاجه — إزاي تضيف منتج، مشكله بتقابلك، اقتراح لتحسين، أو أي حاجه تانيه 👋
        </div>
      </div>
      <form class="sup-input" onsubmit="supSend(event)">
        <input type="text" id="sup-in" placeholder="اكتب سؤالك..." autocomplete="off" required>
        <button type="submit" id="sup-btn">➤</button>
      </form>
    </div>

    <script>
      (function(){
        const history = [];
        window.supToggle = function(){
          const p = document.getElementById('sup-panel');
          p.classList.toggle('open');
          if (p.classList.contains('open')) setTimeout(()=>document.getElementById('sup-in').focus(), 100);
        };
        window.supSend = async function(e){
          e.preventDefault();
          const input = document.getElementById('sup-in');
          const btn = document.getElementById('sup-btn');
          const body = document.getElementById('sup-body');
          const text = input.value.trim();
          if (!text) return;
          const um = document.createElement('div'); um.className='sup-msg user'; um.textContent=text; body.appendChild(um);
          history.push({role:'user', content:text});
          input.value=''; btn.disabled=true;
          const t = document.createElement('div'); t.className='sup-typing'; t.textContent='بيكتب...'; body.appendChild(t);
          body.scrollTop = body.scrollHeight;
          try {
            const r = await fetch('/api/support/chat', {
              method:'POST',
              headers:{'Content-Type':'application/json;charset=UTF-8'},
              body: JSON.stringify({messages: history}),
            });
            const data = await r.json();
            t.remove();
            const reply = (data.reply || 'مقدرتش أرد دلوقتي، حاول تاني.').trim();
            const bm = document.createElement('div'); bm.className='sup-msg bot'; bm.textContent=reply; body.appendChild(bm);
            history.push({role:'assistant', content:reply});
          } catch (err) {
            t.remove();
            const em = document.createElement('div'); em.className='sup-msg error'; em.textContent='مشكلة في الاتصال، اتأكد من النت وحاول تاني.'; body.appendChild(em);
          } finally {
            btn.disabled=false;
            body.scrollTop = body.scrollHeight;
            input.focus();
          }
        };
      })();
    </script>
  `;
}

function dashboardPage({ title, merchant, activeKey, subtitle, body }) {
  return page({
    title,
    body: `
      ${topbar(merchant, subtitle)}
      <div class="container">
        ${body}
      </div>
      ${bottomNav(activeKey)}
      ${supportWidget()}
    `,
  });
}

module.exports = { CATEGORIES, categoryLabel, categoryConfigFor, suggestedMargin, esc, money, jsonScriptSafe, fmtDate, bottomNav, topbar, page, dashboardPage };
