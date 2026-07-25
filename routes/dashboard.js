const { queryOne, query } = require('../lib/db');
const { dashboardPage, esc, money, categoryLabel } = require('../lib/view');
const { sendHtml } = require('../lib/http-helpers');

function registerRoutes(router) {
  router.get('/dashboard', async (req, res) => {
    const m = req.merchant;

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
      <div class="grid-2">
        <div class="stat brand">
          <div class="label">مبيعات النهاردة</div>
          <div class="value">${money(todayRow.total)}</div>
        </div>
        <div class="stat success">
          <div class="label">رصيد الخزنة</div>
          <div class="value">${money(balance)}</div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-title">صفحة البيع بتاعتك (لاندنج بيدج)</div>
        <div class="link-box">
          <span class="url">${req.headers.host}${storeUrl}</span>
        </div>
        <a href="${storeUrl}" target="_blank" class="btn btn-outline mt-8" style="margin-top:10px;">👀 شوف صفحتك دلوقتي</a>
      </div>

      <div class="card">
        <div class="card-title">إجراءات سريعة</div>
        <div class="grid-2">
          <a href="/dashboard/products#add" class="btn btn-outline">➕ منتج جديد</a>
          <a href="/dashboard/sales#add" class="btn btn-outline">🧾 بيع جديد</a>
          <a href="/dashboard/purchases#add" class="btn btn-outline">🛒 شراء جديد</a>
          <a href="/dashboard/cash" class="btn btn-outline">💰 الخزنة</a>
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
