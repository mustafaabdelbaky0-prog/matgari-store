const { query, queryOne, exec } = require('../lib/db');
const { dashboardPage, esc, money, suggestedMargin } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function registerRoutes(router) {
  router.get('/dashboard/purchases', async (req, res) => {
    const m = req.merchant;
    const products = await query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY name', [m.id]);
    const purchases = await query("SELECT * FROM transactions WHERE merchant_id = $1 AND type='purchase' ORDER BY id DESC LIMIT 40", [m.id]);

    const body = `
      <details id="add" class="card">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">🛒 تسجيل عملية شراء / توريد</summary>
        <div class="mt-16">
          <form method="POST" action="/dashboard/purchases/add">
            <div class="field">
              <label>المنتج</label>
              <select name="product_id" id="purchase-product-select">
                <option value="">➕ منتج جديد (هيتسجل تلقائي في المخزون)</option>
                ${products.map((p) => `<option value="${p.id}">${esc(p.name)} — الحالي: ${p.quantity}</option>`).join('')}
              </select>
            </div>
            <div class="field" id="new-product-name-field">
              <label>اسم المنتج الجديد (لو مش موجود بالفوق)</label>
              <input type="text" name="new_product_name" placeholder="مثال: بنطلون جينز">
            </div>
            <div class="input-row">
              <div class="field"><label>الكمية اللي هتشتريها</label><input type="number" name="quantity" min="1" value="1" required></div>
              <div class="field"><label>سعر الشراء للقطعة</label><input type="number" step="0.01" name="cost_price" min="0" required></div>
            </div>
            <div class="field">
              <label>سعر البيع المقترح (للمنتج الجديد بس)</label>
              <input type="number" step="0.01" name="sell_price" min="0" placeholder="اختياري">
            </div>
            <button class="btn btn-primary" type="submit">📥 إضافة للمخزون</button>
          </form>
        </div>
      </details>

      <div class="card">
        <div class="card-title">آخر عمليات الشراء</div>
        ${purchases.length === 0 ? `<div class="empty"><div class="big">🛒</div>لسه معملتش أي عملية شراء</div>` : purchases.map((p) => `
          <div class="row">
            <div class="thumb">🛒</div>
            <div class="main">
              <div class="title">${esc(p.product_name || 'منتج')} ${p.quantity > 1 ? `× ${p.quantity}` : ''}</div>
              <div class="meta">${p.created_at}</div>
            </div>
            <div class="amount" style="color:var(--danger);">-${money(p.amount)}</div>
          </div>
        `).join('')}
      </div>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'المشتريات', merchant: m, activeKey: 'purchases', subtitle: 'سجّل توريد بضاعتك', body }));
  });

  router.post('/dashboard/purchases/add', async (req, res) => {
    const m = req.merchant;
    const b = await parseBody(req);
    const qty = Math.max(1, parseInt(b.quantity, 10) || 1);
    const cost = parseFloat(b.cost_price) || 0;
    let product;

    if (b.product_id) {
      product = await queryOne('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [b.product_id, m.id]);
      if (product) {
        await exec('UPDATE products SET quantity = quantity + $1, cost_price = $2 WHERE id = $3', [qty, cost, product.id]);
      }
    }

    if (!product) {
      const name = (b.new_product_name || '').trim();
      if (!name) return redirect(res, '/dashboard/purchases');
      const margin = suggestedMargin(m.category);
      const sell = b.sell_price && parseFloat(b.sell_price) > 0 ? parseFloat(b.sell_price) : Math.round(cost * (1 + margin / 100) * 100) / 100;
      const inserted = await queryOne(`
        INSERT INTO products (merchant_id, name, cost_price, sell_price, quantity, visible)
        VALUES ($1, $2, $3, $4, $5, 1) RETURNING id
      `, [m.id, name, cost, sell, qty]);
      product = { id: inserted.id, name };
    }

    await exec(`
      INSERT INTO transactions (merchant_id, type, product_id, product_name, quantity, amount)
      VALUES ($1, 'purchase', $2, $3, $4, $5)
    `, [m.id, product.id, product.name, qty, cost * qty]);

    redirect(res, '/dashboard/purchases');
  });
}

module.exports = { registerRoutes };
