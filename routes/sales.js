const { query, queryOne, exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { dashboardPage, esc, money } = require('../lib/view');
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
  router.get('/dashboard/sales', async (req, res) => {
    const m = await getRequestMerchant(req);
    const products = await query('SELECT * FROM products WHERE merchant_id = $1 AND quantity > 0 ORDER BY name', [m.id]);
    const sales = await query("SELECT * FROM transactions WHERE merchant_id = $1 AND type='sale' ORDER BY id DESC LIMIT 40", [m.id]);
    const todayRow = await queryOne(`
      SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS cnt
      FROM transactions WHERE merchant_id = $1 AND type='sale' AND created_at::date = CURRENT_DATE
    `, [m.id]);
    const key = stockKeyFor(m.category);
    const stockLabel = categoryStockLabel(m.category);

    const productsJs = products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      sell_price: p.sell_price,
      variants: variantValues(p, m.category),
      stock: readStockMap(p),
    }));

    const body = `
      <div class="grid-2">
        <div class="stat brand"><div class="label">مبيعات النهاردة</div><div class="value">${money(todayRow.total)}</div></div>
        <div class="stat"><div class="label">عدد عمليات البيع</div><div class="value">${todayRow.cnt}</div></div>
      </div>

      <details id="add" class="card mt-16">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">🧾 تسجيل عملية بيع</summary>
        <div class="mt-16">
          ${products.length === 0 ? `<div class="empty">مفيش منتجات متاحة بالمخزون، <a href="/dashboard/products">ضيف منتج الأول</a></div>` : `
          <form method="POST" action="/dashboard/sales/add" id="sale-form">
            <div class="field">
              <label>المنتج</label>
              <select name="product_id" id="sale-product-select" required>
                ${products.map((p) => `<option value="${p.id}" data-price="${p.sell_price}" data-stock="${p.quantity}">${esc(p.name)} — متاح ${p.quantity} — ${money(p.sell_price)}</option>`).join('')}
              </select>
            </div>

            <div id="variant-sold-block"></div>

            <div class="input-row">
              <div class="field"><label>الكميه المباعه (إجمالي)</label><input type="number" name="quantity" id="sale-qty-input" min="1" value="1" required></div>
              <div class="field"><label>سعر البيع الإجمالي</label><input type="number" step="0.01" name="amount" placeholder="هيتحسب تلقائي لو سيبته فاضي"></div>
            </div>
            <div class="field"><label>اسم العميل (اختياري)</label><input type="text" name="note" placeholder="مثال: ساره - طلب واتساب"></div>
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

      <script>
        (function(){
          const PRODUCTS = ${JSON.stringify(productsJs)};
          const STOCK_LABEL = ${JSON.stringify(stockLabel)};
          const HAS_STOCK_KEY = ${JSON.stringify(!!key)};
          const sel = document.getElementById('sale-product-select');
          if (!sel) return;
          const block = document.getElementById('variant-sold-block');
          const qtyInput = document.getElementById('sale-qty-input');

          function render(){
            block.innerHTML = '';
            if (!HAS_STOCK_KEY) return;
            const pid = sel.value;
            const p = PRODUCTS.find(x => String(x.id) === String(pid));
            if (!p || !p.variants || p.variants.length === 0) return;
            const rows = p.variants.map(v => {
              const stock = p.stock[v] || 0;
              const disabled = stock <= 0 ? 'disabled' : '';
              return \`
              <label style="display:flex;flex-direction:column;gap:4px;\${stock <= 0 ? 'opacity:.5;' : ''}">
                <span style="font-size:12px;font-weight:600;">\${v} <span style="color:#9ca3af;font-weight:400;">(متاح: \${stock})</span></span>
                <input type="number" name="stock_\${v}" min="0" max="\${stock}" value="0" \${disabled} data-sold-qty
                  style="border:1.5px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:14px;">
              </label>\`;
            }).join('');
            block.innerHTML = \`
              <div style="border:1px dashed #e5e7eb;border-radius:12px;padding:12px;margin:12px 0;background:#fafafa;">
                <div style="font-weight:700;font-size:12.5px;margin-bottom:10px;color:#6b7280;">
                  الكميه المباعه لكل \${STOCK_LABEL}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">\${rows}</div>
              </div>
            \`;
            block.querySelectorAll('[data-sold-qty]').forEach(inp => {
              inp.addEventListener('input', () => {
                let total = 0;
                block.querySelectorAll('[data-sold-qty]').forEach(x => total += (parseInt(x.value, 10) || 0));
                qtyInput.value = total || 1;
              });
            });
          }

          sel.addEventListener('change', render);
          render();
        })();
      </script>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'المبيعات', merchant: m, activeKey: 'sales', subtitle: 'سجّل مبيعاتك أول بأول', body }));
  });

  router.post('/dashboard/sales/add', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    const product = await queryOne('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [b.product_id, m.id]);
    if (!product) return redirect(res, '/dashboard/sales');

    const soldByVariant = extractStockMap(b);
    const perVariantTotal = totalFromStockMap(soldByVariant);
    const requestedQty = Math.max(1, parseInt(b.quantity, 10) || 1);

    let sellQty;
    let newStockMap = readStockMap(product);
    let newTotal = Number(product.quantity) || 0;

    if (perVariantTotal > 0) {
      // Deduct per-variant, clamped to available stock.
      newStockMap = { ...newStockMap };
      let actuallySold = 0;
      for (const [k, v] of Object.entries(soldByVariant)) {
        const available = Number(newStockMap[k]) || 0;
        const take = Math.min(available, v);
        newStockMap[k] = available - take;
        actuallySold += take;
      }
      sellQty = actuallySold;
      newTotal = totalFromStockMap(newStockMap);
    } else {
      // No per-variant breakdown — just decrement total qty (backward compat).
      sellQty = Math.min(requestedQty, newTotal);
      newTotal = newTotal - sellQty;
    }

    if (sellQty <= 0) return redirect(res, '/dashboard/sales');

    const amount = b.amount && parseFloat(b.amount) > 0
      ? parseFloat(b.amount)
      : product.sell_price * sellQty;

    await exec(
      'UPDATE products SET quantity = $1, variant_stock = $2::jsonb WHERE id = $3',
      [newTotal, JSON.stringify(newStockMap), product.id]
    );
    await exec(`
      INSERT INTO transactions (merchant_id, type, product_id, product_name, quantity, amount, note)
      VALUES ($1, 'sale', $2, $3, $4, $5, $6)
    `, [m.id, product.id, product.name, sellQty, amount, (b.note || '').trim()]);

    redirect(res, '/dashboard/sales');
  });
}

module.exports = { registerRoutes };
