const { queryOne, query } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { dashboardPage, esc, money, categoryLabel } = require('../lib/view');
const { sendHtml } = require('../lib/http-helpers');

function registerRoutes(router) {
  router.get('/dashboard', async (req, res) => {
    const m = await getRequestMerchant(req);

    const balanceRow = await queryOne(`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('sale','income') THEN amount ELSE 0 END),0) AS income,
        COALESCE(SUM(CASE WHEN type IN ('purchase','expense') THEN amount ELSE 0 END),0) AS expense
      FROM transactions WHERE merchant_id = $1
    `, [m.id]);
    const balance = Number(balanceRow.income) - Number(balanceRow.expense);

    const todayRow = await queryOne(`
      SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt
      FROM transactions WHERE merchant_id = $1 AND type='sale' AND created_at::date = CURRENT_DATE
    `, [m.id]);

    const countRow = await queryOne('SELECT COUNT(*) AS c FROM products WHERE merchant_id = $1', [m.id]);
    const productsCount = Number(countRow.c);
    const lowStock = await query('SELECT * FROM products WHERE merchant_id = $1 AND quantity <= 3 ORDER BY quantity ASC LIMIT 5', [m.id]);
    const recent = await query('SELECT * FROM transactions WHERE merchant_id = $1 ORDER BY id DESC LIMIT 5', [m.id]);

    const storeUrl = `/store/${m.slug}`;

    const body = `
      <style>
        .dash-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
        .dash-stat{position:relative;padding:20px 18px;border-radius:18px;color:#fff;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,.08)}
        .dash-stat::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 100% 0%,rgba(255,255,255,.25) 0%,transparent 60%);pointer-events:none}
        .dash-stat.sales{background:linear-gradient(135deg,#4f46e5,#7c3aed)}
        .dash-stat.balance{background:linear-gradient(135deg,#059669,#10b981)}
        .dash-stat .icon{font-size:22px;margin-bottom:8px;display:block}
        .dash-stat .label{font-size:12.5px;font-weight:600;opacity:.92;margin-bottom:6px}
        .dash-stat .value{font-size:22px;font-weight:800;letter-spacing:-.02em}

        .quick-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px}
        .qa{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:18px 16px;border-radius:16px;text-decoration:none;color:#fff;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;box-shadow:0 6px 16px rgba(0,0,0,.10)}
        .qa:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(0,0,0,.15)}
        .qa::before{content:'';position:absolute;top:-30px;right:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(255,255,255,.28) 0%,transparent 65%);pointer-events:none}
        .qa .qa-icon{font-size:26px}
        .qa .qa-title{font-size:15px;font-weight:800}
        .qa .qa-sub{font-size:11.5px;opacity:.92;font-weight:500}
        .qa.product{background:linear-gradient(135deg,#f59e0b,#f97316)}
        .qa.sale{background:linear-gradient(135deg,#10b981,#059669)}
        .qa.purchase{background:linear-gradient(135deg,#3b82f6,#2563eb)}
        .qa.cash{background:linear-gradient(135deg,#8b5cf6,#6d28d9)}

        .store-link-card{background:linear-gradient(135deg,#fff,#f9fafb);border:1.5px solid #e5e7eb;border-radius:18px;padding:18px;margin-top:14px;box-shadow:0 4px 12px rgba(0,0,0,.04)}
        .store-link-card .slc-title{font-weight:800;font-size:14px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
        .store-link-card .slc-link{background:#f3f4f6;border-radius:10px;padding:10px 14px;font-size:12.5px;color:#4b5563;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:10px}
        .store-link-card .slc-actions{display:flex;gap:8px}
        .store-link-card .slc-btn{flex:1;text-align:center;padding:10px;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;transition:all .15s;border:1.5px solid transparent}
        .store-link-card .slc-btn.primary{background:#4f46e5;color:#fff}
        .store-link-card .slc-btn.primary:hover{background:#4338ca}
        .store-link-card .slc-btn.ghost{background:#fff;color:#374151;border-color:#e5e7eb}
        .store-link-card .slc-btn.ghost:hover{background:#f9fafb}
      </style>

      <div class="dash-stats">
        <div class="dash-stat sales">
          <span class="icon">💰</span>
          <div class="label">مبيعات النهاردة</div>
          <div class="value">${money(todayRow.total)}</div>
        </div>
        <div class="dash-stat balance">
          <span class="icon">🏦</span>
          <div class="label">رصيد الخزنة</div>
          <div class="value">${money(balance)}</div>
        </div>
      </div>

      <div class="store-link-card">
        <div class="slc-title">🌐 صفحه البيع بتاعتك</div>
        <div class="slc-link">${req.headers.host}${storeUrl}</div>
        <div class="slc-actions">
          <a href="${storeUrl}" target="_blank" class="slc-btn primary">👀 شوف صفحتك</a>
          <button class="slc-btn ghost" data-copy="${req.headers.host}${storeUrl}">📋 نسخ الرابط</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">إجراءات سريعة</div>
        <div class="quick-actions">
          <a href="/dashboard/products#add" class="qa product">
            <span class="qa-icon">📦</span>
            <span class="qa-title">منتج جديد</span>
            <span class="qa-sub">أضف للمخزون</span>
          </a>
          <a href="/dashboard/sales#add" class="qa sale">
            <span class="qa-icon">🧾</span>
            <span class="qa-title">بيع جديد</span>
            <span class="qa-sub">سجّل عمليه بيع</span>
          </a>
          <a href="/dashboard/purchases#add" class="qa purchase">
            <span class="qa-icon">🛒</span>
            <span class="qa-title">شراء جديد</span>
            <span class="qa-sub">توريد بضاعه</span>
          </a>
          <a href="/dashboard/cash" class="qa cash">
            <span class="qa-icon">💵</span>
            <span class="qa-title">الخزنه</span>
            <span class="qa-sub">دخل ومصروفات</span>
          </a>
        </div>
      </div>

      ${lowStock.length ? `
      <div class="card">
        <div class="card-title">⚠️ منتجات على وشك الخلاص</div>
        ${lowStock.map((p) => `
          <div class="row">
            <div class="thumb">${p.image ? `<img src="${p.image}">` : '📦'}</div>
            <div class="main">
              <div class="title">${esc(p.name)}</div>
              <div class="meta">متبقي ${p.quantity} بس</div>
            </div>
            <span class="chip chip-danger">قرّب يخلص</span>
          </div>
        `).join('')}
      </div>` : ''}

      <div class="card">
        <div class="card-title">آخر الحركات</div>
        ${recent.length ? recent.map((t) => `
          <div class="row">
            <div class="thumb">${t.type === 'sale' ? '🧾' : t.type === 'purchase' ? '🛒' : t.type === 'income' ? '💵' : '📤'}</div>
            <div class="main">
              <div class="title">${esc(t.product_name || t.note || (t.type === 'sale' ? 'عملية بيع' : 'عملية شراء'))}</div>
              <div class="meta">${t.created_at}</div>
            </div>
            <div class="amount" style="color:${t.type === 'sale' || t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">
              ${t.type === 'sale' || t.type === 'income' ? '+' : '-'}${money(t.amount)}
            </div>
          </div>
        `).join('') : `<div class="empty"><div class="big">📭</div>لسه معملتش أي حركة بيع أو شراء</div>`}
      </div>

      <div class="footer-note">متجرك (${categoryLabel(m.category)}) — منتجاتك: ${productsCount}</div>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'الرئيسية', merchant: m, activeKey: 'home', subtitle: categoryLabel(m.category), body }));
  });
}

module.exports = { registerRoutes };
