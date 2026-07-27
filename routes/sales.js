const { query, queryOne, exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { dashboardPage, esc, money } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function registerRoutes(router) {
  router.get('/dashboard/sales', async (req, res) => {
    const m = await getRequestMerchant(req);
    const products = await query('SELECT * FROM products WHERE merchant_id = $1 AND quantity > 0 ORDER BY name', [m.id]);
    const sales = await query("SELECT * FROM transactions WHERE merchant_id = $1 AND type='sale' ORDER BY id DESC LIMIT 40", [m.id]);
    const todayRow = await queryOne(`
      SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt
      FROM transactions WHERE merchant_id = $1 AND type='sale' AND created_at::date = CURRENT_DATE
    `, [m.id]);

    const body = `
      <div class="grid-2">
        <div class="stat brand"><div class="label">مبيعات النهاردة</div><div class="value">${money(todayRow.total)}</div></div>
        <div class="stat"><div class="label">عدد عمليات البيع</div><div class="value">${todayRow.cnt}</div></div>
      </div>

      <details id="add" class="card mt-16">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">🧾 تسجيل عملية بيع</summary>
        <div class="mt-16">
          ${products.length === 0 ? `<div class="empty">مفيش منتجات متاحة بالمخزون، <a href="/dashboard/products">ضيف منتج الأول</a></div>` : `
          <form method="POST" action="/dashboard/sales/add">
            <div class="field">
              <label>المنتج</label>
              <select name="product_id" required>
                ${products.map((p) => `<option value="${p.id}" data-price="${p.sell_price}" data-stock="${p.quantity}">${esc(p.name)} — متاح ${p.quantity} — ${money(p.sell_price)}</option>`).join('')}
              </select>
            </div>
            <div class="input-row">
              <div class="field"><label>الكمية المباعة</label><input type="number" name="quantity" min="1" value="1" required></div>
              <div class="field"><label>سعر البيع الإجمالي</label><input type="number" step="0.01" name="amount" placeholder="هيتحسب تلقائي لو سيبته فاضي"></div>
            </div>
            <div class="field"><label>اسم العميل (اختياري)</label><input type="text" name="note" placeholder="مثال: سارة - طلب واتساب"></div>
            <button class="btn btn-success" type="submit">💵 تسجيل البيع</button>
          </form>
          `}
        </div>
      </details>

      <div class="card">
        <div class="card-title">آخر عمليات البيع</div>
        ${sales.length === 0 ? `<div class="empty"><div class="big">🧾</div>لسه معملتش أي بيع</div>` : sales.map((s) => `
          <div class="row">
            <div class="thumb">🧾</div>
            <div class="main">
              <div class="title">${esc(s.product_name || 'منتج')} ${s.quantity > 1 ? `× ${s.quantity}` : ''}</div>
              <div class="meta">${esc(s.note || '')} ${s.note ? '· ' : ''}${s.created_at}</div>
            </div>
            <div class="amount" style="color:var(--success);">+${money(s.amount)}</div>
          </div>
        `).join('')}
      </div>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'المبيعات', merchant: m, activeKey: 'sales', subtitle: 'سجّل مبيعاتك أول بأول', body }));
  });

  router.post('/dashboard/sales/add', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    const product = await queryOne('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [b.product_id, m.id]);
    if (!product) return redirect(res, '/dashboard/sales');

    const qty = Math.max(1, parseInt(b.quantity, 10) || 1);
    const sellQty = Math.min(qty, product.quantity);
    const amount = b.amount && parseFloat(b.amount) > 0 ? parseFloat(b.amount) : product.sell_price * sellQty;

    await exec('UPDATE products SET quantity = quantity - $1 WHERE id = $2', [sellQty, product.id]);
    await exec(`
      INSERT INTO transactions (merchant_id, type, product_id, product_name, quantity, amount, note)
      VALUES ($1, 'sale', $2, $3, $4, $5, $6)
    `, [m.id, product.id, product.name, sellQty, amount, (b.note || '').trim()]);

    redirect(res, '/dashboard/sales');
  });
}

module.exports = { registerRoutes };
