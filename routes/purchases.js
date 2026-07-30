const { query, queryOne, exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { dashboardPage, esc, money, suggestedMargin } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');
const {
  stockKeyFor,
  variantValues,
  readStockMap,
  totalFromStockMap,
  extractStockMap,
  categoryStockLabel,
} = require('../lib/variant-stock');

function registerRoutes(router) {
  router.get('/dashboard/purchases', async (req, res) => {
    const m = await getRequestMerchant(req);
    const products = await query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY name', [m.id]);
    const purchases = await query("SELECT * FROM transactions WHERE merchant_id = $1 AND type='purchase' ORDER BY id DESC LIMIT 40", [m.id]);
    const key = stockKeyFor(m.category);
    const stockLabel = categoryStockLabel(m.category);

    // Serialize each product's variant list + current stock for the front-end.
    const productsJs = products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      variants: variantValues(p, m.category),
      stock: readStockMap(p),
    }));

    const body = `
      <details id="add" class="card">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">🛒 تسجيل عملية شراء / توريد</summary>
        <div class="mt-16">
          <form method="POST" action="/dashboard/purchases/add" id="purchase-form">
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

            <div id="variant-stock-block"></div>

            <div class="input-row">
              <div class="field"><label>الكمية اللي هتشتريها (إجمالي)</label><input type="number" name="quantity" id="qty-input" min="1" value="1" required></div>
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
              <div class="meta">${esc(p.note || '')} ${p.note ? '· ' : ''}${p.created_at}</div>
            </div>
            <div class="amount" style="color:var(--danger);">-${money(p.amount)}</div>
          </div>
        `).join('')}
      </div>

      <script>
        (function(){
          const PRODUCTS = ${JSON.stringify(productsJs)};
          const STOCK_LABEL = ${JSON.stringify(stockLabel)};
          const HAS_STOCK_KEY = ${JSON.stringify(!!key)};
          const sel = document.getElementById('purchase-product-select');
          const block = document.getElementById('variant-stock-block');
          const qtyInput = document.getElementById('qty-input');

          function render(){
            block.innerHTML = '';
            if (!HAS_STOCK_KEY) return;
            const pid = sel.value;
            if (!pid) return; // new product — no variants known yet
            const p = PRODUCTS.find(x => String(x.id) === String(pid));
            if (!p || !p.variants || p.variants.length === 0) return;
            const rows = p.variants.map(v => \`
              <label style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-size:12px;font-weight:600;">\${v} <span style="color:#9ca3af;font-weight:400;">(الحالي: \${p.stock[v] || 0})</span></span>
                <input type="number" name="stock_\${v}" min="0" value="0" data-variant-qty
                  style="border:1.5px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:14px;">
              </label>
            \`).join('');
            block.innerHTML = \`
              <div style="border:1px dashed #e5e7eb;border-radius:12px;padding:12px;margin:12px 0;background:#fafafa;">
                <div style="font-weight:700;font-size:12.5px;margin-bottom:10px;color:#6b7280;">
                  الكمية المضافه لكل \${STOCK_LABEL}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                  \${rows}
                </div>
                <div style="font-size:11px;color:#9ca3af;margin-top:8px;">حط الكميه الي جاتلك الآن من كل \${STOCK_LABEL}. الإجمالي هيتحسب تلقائي.</div>
              </div>
            \`;
            // Auto-sum → total qty
            block.querySelectorAll('[data-variant-qty]').forEach(inp => {
              inp.addEventListener('input', () => {
                let total = 0;
                block.querySelectorAll('[data-variant-qty]').forEach(x => total += (parseInt(x.value, 10) || 0));
                qtyInput.value = total;
              });
            });
          }

          sel.addEventListener('change', render);
          render();
        })();
      </script>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'المشتريات', merchant: m, activeKey: 'purchases', subtitle: 'سجّل توريد بضاعتك', body }));
  });

  router.post('/dashboard/purchases/add', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    const cost = parseFloat(b.cost_price) || 0;
    let product;

    // Per-variant additions (only present when product has a stockKey and it's an existing product).
    const addedStock = extractStockMap(b);
    const perVariantTotal = totalFromStockMap(addedStock);
    // If the user filled in per-variant counts, they override the total qty field.
    const qty = perVariantTotal > 0 ? perVariantTotal : Math.max(1, parseInt(b.quantity, 10) || 1);

    if (b.product_id) {
      product = await queryOne('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [b.product_id, m.id]);
      if (product) {
        // Merge per-variant additions into existing variant_stock.
        let newStockMap = readStockMap(product);
        if (Object.keys(addedStock).length > 0) {
          newStockMap = { ...newStockMap };
          for (const [k, v] of Object.entries(addedStock)) {
            newStockMap[k] = (Number(newStockMap[k]) || 0) + v;
          }
        }
        // Keep products.quantity in sync: prefer the sum of variant stock if we
        // have per-variant data, otherwise just add the raw qty.
        const newTotal = Object.keys(addedStock).length > 0
          ? totalFromStockMap(newStockMap)
          : (Number(product.quantity) || 0) + qty;

        await exec(
          'UPDATE products SET quantity = $1, cost_price = $2, variant_stock = $3::jsonb WHERE id = $4',
          [newTotal, cost, JSON.stringify(newStockMap), product.id]
        );
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
