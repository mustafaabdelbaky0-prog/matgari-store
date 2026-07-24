const db = require('../lib/db');
const { dashboardPage, esc, money, suggestedMargin } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function productForm({ id, product, cardTitle, submitLabel, actionUrl, defaultMargin }) {
  const p = product || {};
  return `
  <form method="POST" action="${actionUrl}" data-price-suggest enctype="application/x-www-form-urlencoded">
    <div class="field">
      <label>اسم المنتج</label>
      <input type="text" name="name" required value="${esc(p.name || '')}" placeholder="مثال: تيشيرت قطن">
    </div>

    <div class="field">
      <label>صورة المنتج</label>
      <div class="img-upload">
        <img class="preview" src="${p.image || ''}" style="${p.image ? '' : 'display:none;'}">
        <div class="placeholder" style="${p.image ? 'display:none;' : ''}">📷 اضغط لاختيار صورة (اختياري)</div>
        <input type="file" accept="image/*">
        <input type="hidden" name="image" value="${p.image ? esc(p.image) : ''}">
      </div>
    </div>

    <div class="input-row">
      <div class="field">
        <label>سعر الشراء (التكلفة)</label>
        <input type="number" step="0.01" min="0" name="cost_price" required value="${p.cost_price ?? ''}">
      </div>
      <div class="field">
        <label>هامش الربح %</label>
        <input type="number" step="1" min="0" name="margin" value="${defaultMargin}">
      </div>
    </div>

    <div class="field">
      <label>سعر البيع المقترح للعميل</label>
      <input type="number" step="0.01" min="0" name="sell_price" required value="${p.sell_price ?? ''}">
      <div class="hint suggest-hint"></div>
    </div>

    <div class="field">
      <label>الكمية المتاحة</label>
      <input type="number" step="1" min="0" name="quantity" required value="${p.quantity ?? 0}">
    </div>

    <div class="field">
      <label>وصف بسيط (هيظهر في صفحة البيع)</label>
      <textarea name="description" placeholder="مقاسات، خامة، ألوان متاحة...">${esc(p.description || '')}</textarea>
    </div>

    <div class="field">
      <label style="display:flex;align-items:center;gap:8px;font-weight:600;">
        <input type="checkbox" name="visible" value="1" style="width:auto;" ${p.visible === undefined || p.visible ? 'checked' : ''}>
        اظهار المنتج في صفحة البيع (اللاندنج بيدج) بتاعتي
      </label>
    </div>

    <button class="btn btn-primary" type="submit">${submitLabel}</button>
  </form>`;
}

function registerRoutes(router) {
  router.get('/dashboard/products', (req, res) => {
    const m = req.merchant;
    const products = db.prepare('SELECT * FROM products WHERE merchant_id = ? ORDER BY id DESC').all(m.id);

    const body = `
      <details id="add" class="card">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">➕ إضافة منتج جديد</summary>
        <div class="mt-16">
          ${productForm({ actionUrl: '/dashboard/products/add', submitLabel: 'إضافة المنتج للمخزون', defaultMargin: suggestedMargin(m.category) })}
        </div>
      </details>

      <div class="section-head" style="margin:18px 0 10px;">
        <h2>منتجاتك (${products.length})</h2>
      </div>

      ${products.length === 0 ? `<div class="empty"><div class="big">📦</div>لسه مضفتش منتجات، ضيف أول منتج من فوق</div>` : ''}

      ${products.map((p) => `
        <details class="card">
          <summary style="cursor:pointer;display:flex;align-items:center;gap:12px;list-style:none;">
            <div class="thumb">${p.image ? `<img src="${p.image}">` : '📦'}</div>
            <div class="main">
              <div class="title">${esc(p.name)}</div>
              <div class="meta">الكمية: ${p.quantity} · سعر البيع: ${money(p.sell_price)}</div>
            </div>
            ${!p.visible ? '<span class="chip chip-warning">مخفي</span>' : (p.quantity <= 3 ? '<span class="chip chip-danger">قليل</span>' : '<span class="chip chip-success">متاح</span>')}
          </summary>
          <div class="mt-16">
            ${productForm({ product: p, actionUrl: `/dashboard/products/${p.id}/edit`, submitLabel: 'حفظ التعديلات', defaultMargin: suggestedMargin(m.category) })}
            <form method="POST" action="/dashboard/products/${p.id}/delete" data-confirm="متأكد إنك عايز تمسح المنتج ده؟" style="margin-top:10px;">
              <button class="btn btn-danger" type="submit">🗑️ حذف المنتج</button>
            </form>
          </div>
        </details>
      `).join('')}
    `;

    sendHtml(res, 200, dashboardPage({ title: 'المخزون', merchant: m, activeKey: 'products', subtitle: 'المخزون والمنتجات', body }));
  });

  router.post('/dashboard/products/add', async (req, res) => {
    const m = req.merchant;
    const b = await parseBody(req);
    const name = (b.name || '').trim();
    const cost = parseFloat(b.cost_price) || 0;
    const sell = parseFloat(b.sell_price) || 0;
    const qty = parseInt(b.quantity, 10) || 0;
    if (!name) return redirect(res, '/dashboard/products');

    db.prepare(`
      INSERT INTO products (merchant_id, name, description, cost_price, sell_price, quantity, image, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m.id, name, (b.description || '').trim(), cost, sell, qty, b.image || null, b.visible ? 1 : 0);

    redirect(res, '/dashboard/products');
  });

  router.post('/dashboard/products/:id/edit', async (req, res, params) => {
    const m = req.merchant;
    const b = await parseBody(req);
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND merchant_id = ?').get(params.id, m.id);
    if (!product) return redirect(res, '/dashboard/products');

    const name = (b.name || '').trim() || product.name;
    const cost = parseFloat(b.cost_price) || 0;
    const sell = parseFloat(b.sell_price) || 0;
    const qty = b.quantity !== undefined ? parseInt(b.quantity, 10) || 0 : product.quantity;

    db.prepare(`
      UPDATE products SET name=?, description=?, cost_price=?, sell_price=?, quantity=?, image=?, visible=?
      WHERE id = ? AND merchant_id = ?
    `).run(name, (b.description || '').trim(), cost, sell, qty, b.image || null, b.visible ? 1 : 0, params.id, m.id);

    redirect(res, '/dashboard/products');
  });

  router.post('/dashboard/products/:id/delete', async (req, res, params) => {
    const m = req.merchant;
    db.prepare('DELETE FROM products WHERE id = ? AND merchant_id = ?').run(params.id, m.id);
    redirect(res, '/dashboard/products');
  });
}

module.exports = { registerRoutes };
