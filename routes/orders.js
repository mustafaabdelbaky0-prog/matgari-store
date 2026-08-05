// orders.js — public checkout + merchant order management.
//
// Public:
//   POST /store/:slug/order — creates an order, decrements stock, sends
//                             notifications (email/telegram if configured),
//                             returns a JSON success or an HTML thank-you.
//
// Merchant (auth required):
//   GET  /dashboard/orders                    — list with tabs (pending/confirmed/shipped/cancelled)
//   POST /dashboard/orders/:id/confirm        — mark as confirmed (stays out of stock)
//   POST /dashboard/orders/:id/ship           — mark as shipped, record sale transactions
//   POST /dashboard/orders/:id/cancel         — mark cancelled, return stock

const { query, queryOne, exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { parseBody } = require('../lib/body');
const { sendHtml, sendJson, redirect } = require('../lib/http-helpers');
const { dashboardPage, esc, money } = require('../lib/view');
const { readStockMap, totalFromStockMap, stockKeyFor } = require('../lib/variant-stock');
const { isActive } = require('../lib/subscription');
const { notifyOrder } = require('../lib/notify');

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

function toNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// Given an incoming order request, load products, validate stock, compute totals.
async function buildValidatedCart(merchantId, requestedItems, category) {
  const errors = [];
  const items = [];
  let total = 0;
  const stockUpdates = []; // { productId, newQty, newStockMap|null }

  for (const req of requestedItems) {
    const pid = Number(req.product_id);
    const qty = Math.max(1, Math.min(999, Number(req.quantity) || 1));
    const variantKey = req.variant_key ? String(req.variant_key).slice(0, 60) : null;
    if (!pid) continue;

    const product = await queryOne('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [pid, merchantId]);
    if (!product) { errors.push(`منتج مش موجود (id=${pid})`); continue; }
    if (product.visible !== 1) { errors.push(`منتج غير متاح: ${product.name}`); continue; }

    const key = stockKeyFor(category);
    if (key && variantKey) {
      const map = readStockMap(product);
      const available = Number(map[variantKey]) || 0;
      if (available < qty) {
        errors.push(`مفيش كميه كافيه من ${product.name} (${variantKey}) — متاح ${available} فقط`);
        continue;
      }
      const newMap = { ...map, [variantKey]: available - qty };
      stockUpdates.push({ productId: product.id, newStockMap: newMap, newQty: totalFromStockMap(newMap) });
    } else {
      const available = Number(product.quantity) || 0;
      if (available < qty) {
        errors.push(`مفيش كميه كافيه من ${product.name} — متاح ${available} فقط`);
        continue;
      }
      stockUpdates.push({ productId: product.id, newStockMap: null, newQty: available - qty });
    }

    const price = Number(product.sell_price) || 0;
    const lineTotal = Math.round(price * qty * 100) / 100;
    total += lineTotal;
    items.push({
      product_id: product.id,
      name: product.name,
      price,
      quantity: qty,
      variant_key: variantKey,
      line_total: lineTotal,
    });
  }

  return { items, total: Math.round(total * 100) / 100, errors, stockUpdates };
}

async function applyStockUpdates(updates) {
  for (const u of updates) {
    if (u.newStockMap) {
      await exec(
        'UPDATE products SET variant_stock = $1::jsonb, quantity = $2 WHERE id = $3',
        [JSON.stringify(u.newStockMap), u.newQty, u.productId]
      );
    } else {
      await exec('UPDATE products SET quantity = $1 WHERE id = $2', [u.newQty, u.productId]);
    }
  }
}

async function returnStockForOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    const p = await queryOne('SELECT * FROM products WHERE id = $1', [item.product_id]);
    if (!p) continue;
    if (item.variant_key) {
      const map = readStockMap(p);
      map[item.variant_key] = (Number(map[item.variant_key]) || 0) + Number(item.quantity || 0);
      const total = totalFromStockMap(map);
      await exec(
        'UPDATE products SET variant_stock = $1::jsonb, quantity = $2 WHERE id = $3',
        [JSON.stringify(map), total, p.id]
      );
    } else {
      const newQty = (Number(p.quantity) || 0) + Number(item.quantity || 0);
      await exec('UPDATE products SET quantity = $1 WHERE id = $2', [newQty, p.id]);
    }
  }
  await exec('UPDATE orders SET stock_returned = TRUE WHERE id = $1', [order.id]);
}

function renderThankYou(merchant, orderId) {
  const wa = merchant.whatsapp ? merchant.whatsapp.replace(/\D/g, '') : '';
  const waLink = wa ? `https://wa.me/${wa.startsWith('20') ? wa : '20' + wa.replace(/^0/, '')}?text=${encodeURIComponent(`السلام عليكم، أنا صاحب الطلب رقم #${orderId} من متجر ${merchant.store_name}`)}` : null;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>تم استلام طلبك — ${esc(merchant.store_name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
body{margin:0;font-family:'Cairo',sans-serif;background:linear-gradient(135deg,#EEF2FF,#FCE7F3);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;color:#0F172A}
.box{background:#fff;border-radius:24px;padding:44px 30px;max-width:480px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,.12)}
.ic{font-size:72px;margin-bottom:14px;animation:pop .5s ease-out}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
h1{margin:0 0 10px;font-size:26px;color:#065F46}
.oid{font-size:14px;color:#475569;background:#F1F5F9;padding:8px 16px;border-radius:20px;display:inline-block;margin:10px 0 18px;font-family:monospace}
p{color:#475569;line-height:1.75;font-size:15px}
.btn{display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;margin-top:14px}
.wa{background:#25D366}
.store{font-weight:800;color:#4F46E5}
</style></head><body><div class="box">
<div class="ic">🎉</div>
<h1>طلبك اتسجّل بنجاح!</h1>
<div class="oid">رقم الطلب: #${orderId}</div>
<p>شكراً لطلبك من <span class="store">${esc(merchant.store_name)}</span>.<br>هيتم مراجعه طلبك والتواصل معاك قريبًا لتأكيد الشحن.</p>
${waLink ? `<a class="btn wa" href="${waLink}" target="_blank">📱 تواصل مع المتجر على واتساب</a><br>` : ''}
<a class="btn" href="/store/${esc(merchant.slug)}">🛍️ رجوع للمتجر</a>
</div></body></html>`;
}

function ordersListBody(orders, activeTab, counts) {
  const rows = orders.map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsSummary = items.map((i) => `${esc(i.name)}${i.variant_key ? ` (${esc(i.variant_key)})` : ''} × ${i.quantity}`).join('<br>');
    const statusColor = {
      pending: '#F59E0B', confirmed: '#3B82F6', shipped: '#10B981', cancelled: '#94A3B8',
    }[o.status] || '#94A3B8';
    return `<tr>
      <td><strong>#${o.id}</strong><br><span style="font-size:11px;color:#64748B">${fmtDate(o.created_at)}</span></td>
      <td>
        <strong>${esc(o.customer_name)}</strong>
        <div style="font-size:12.5px;color:#64748B;direction:ltr;text-align:end">${esc(o.customer_phone)}</div>
        ${o.customer_governorate ? `<div style="font-size:12px;color:#64748B">${esc(o.customer_governorate)}</div>` : ''}
      </td>
      <td style="font-size:13px;line-height:1.7">${itemsSummary}${o.customer_address ? `<div style="font-size:11.5px;color:#64748B;margin-top:6px">📍 ${esc(o.customer_address)}</div>` : ''}${o.notes ? `<div style="font-size:11.5px;color:#475569;margin-top:4px">📝 ${esc(o.notes)}</div>` : ''}</td>
      <td style="text-align:center"><strong>${money(o.total)}</strong></td>
      <td style="text-align:center"><span style="background:${statusColor};color:#fff;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700">${labelFor(o.status)}</span></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:end">
          ${o.status === 'pending' ? `
            <form method="POST" action="/dashboard/orders/${o.id}/confirm" style="display:inline"><button class="ord-btn ok" type="submit">✓ تأكيد</button></form>
            <form method="POST" action="/dashboard/orders/${o.id}/cancel" style="display:inline" onsubmit="return confirm('تلغي الطلب؟ المخزون هيرجع')"><button class="ord-btn dg" type="submit">✕ إلغاء</button></form>
          ` : ''}
          ${o.status === 'confirmed' ? `
            <form method="POST" action="/dashboard/orders/${o.id}/ship" style="display:inline"><button class="ord-btn ok" type="submit">📦 شحن</button></form>
            <form method="POST" action="/dashboard/orders/${o.id}/cancel" style="display:inline" onsubmit="return confirm('تلغي الطلب؟ المخزون هيرجع')"><button class="ord-btn dg" type="submit">✕ إلغاء</button></form>
          ` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<style>
    .ord-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
    .ord-tab{background:#fff;border:1.5px solid #e5e7eb;color:#334155;padding:8px 14px;border-radius:20px;font-family:inherit;font-weight:700;text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px}
    .ord-tab.active{background:#4F46E5;color:#fff;border-color:#4F46E5}
    .ord-tab .bd{background:rgba(15,23,42,.08);padding:1px 8px;border-radius:12px;font-size:11px}
    .ord-tab.active .bd{background:rgba(255,255,255,.25)}
    .ord-table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .ord-table th,.ord-table td{padding:12px 10px;text-align:right;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:13.5px}
    .ord-table th{background:#F8FAFC;font-weight:700;color:#64748B;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em}
    .ord-btn{background:#f1f5f9;color:#334155;border:none;padding:6px 10px;border-radius:8px;font-family:inherit;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap}
    .ord-btn.ok{background:#10B981;color:#fff}
    .ord-btn.dg{background:#DC2626;color:#fff}
    .ord-empty{text-align:center;padding:50px 20px;color:#64748B}
    .ord-empty .big{font-size:56px;margin-bottom:10px}
    .ord-scroll{overflow-x:auto}
  </style>

  <div class="ord-tabs">
    <a class="ord-tab ${activeTab === 'pending' ? 'active' : ''}" href="?tab=pending">جديده <span class="bd">${counts.pending}</span></a>
    <a class="ord-tab ${activeTab === 'confirmed' ? 'active' : ''}" href="?tab=confirmed">مؤكده <span class="bd">${counts.confirmed}</span></a>
    <a class="ord-tab ${activeTab === 'shipped' ? 'active' : ''}" href="?tab=shipped">مشحونه <span class="bd">${counts.shipped}</span></a>
    <a class="ord-tab ${activeTab === 'cancelled' ? 'active' : ''}" href="?tab=cancelled">ملغيه <span class="bd">${counts.cancelled}</span></a>
  </div>

  ${orders.length === 0
    ? `<div class="ord-empty"><div class="big">📭</div>مفيش طلبات في القسم ده</div>`
    : `<div class="ord-scroll"><table class="ord-table">
      <thead><tr><th>#</th><th>العميل</th><th>الطلب</th><th>الإجمالي</th><th>الحاله</th><th>—</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`}
  `;
}

function labelFor(status) {
  return { pending: 'جديد', confirmed: 'مؤكد', shipped: 'اتشحن', cancelled: 'ملغي' }[status] || status;
}

async function pendingCount(merchantId) {
  const r = await queryOne(`SELECT COUNT(*)::int AS n FROM orders WHERE merchant_id = $1 AND status = 'pending'`, [merchantId]);
  return r ? r.n : 0;
}

function registerRoutes(router) {
  router.post('/store/:slug/order', async (req, res, params) => {
    try {
      const merchant = await queryOne('SELECT * FROM merchants WHERE slug = $1', [params.slug]);
      if (!merchant) return sendJson(res, 404, { error: 'store_not_found' });
      if (!isActive(merchant)) return sendJson(res, 403, { error: 'store_closed' });

      const body = await parseBody(req);
      const customerName = String(body.customer_name || '').trim().slice(0, 100);
      const customerPhone = String(body.customer_phone || '').trim().slice(0, 30);
      const customerGov = String(body.customer_governorate || '').trim().slice(0, 60);
      const customerAddr = String(body.customer_address || '').trim().slice(0, 400);
      const notes = String(body.notes || '').trim().slice(0, 400);
      let items = body.items;
      if (typeof items === 'string') { try { items = JSON.parse(items); } catch (e) { items = []; } }
      if (!Array.isArray(items) || items.length === 0) return sendJson(res, 400, { error: 'no_items' });
      if (!customerName || !customerPhone) return sendJson(res, 400, { error: 'missing_customer' });

      const { items: validItems, total, errors, stockUpdates } =
        await buildValidatedCart(merchant.id, items, merchant.category);
      if (validItems.length === 0) return sendJson(res, 400, { error: 'invalid_items', details: errors });

      const inserted = await queryOne(
        `INSERT INTO orders (merchant_id, customer_name, customer_phone, customer_governorate, customer_address, items, total, notes)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8) RETURNING id`,
        [merchant.id, customerName, customerPhone, customerGov || null, customerAddr || null,
         JSON.stringify(validItems), total, notes || null]
      );

      await applyStockUpdates(stockUpdates);

      // Fire notifications (best-effort; never blocks the response).
      const orderForNotify = {
        id: inserted.id, customer_name: customerName, customer_phone: customerPhone,
        customer_governorate: customerGov, customer_address: customerAddr,
        items: validItems, total, notes,
      };
      notifyOrder(orderForNotify, merchant, req.headers.host || '').catch((e) => console.error('[notify]', e));

      // Content negotiation: if the caller wants JSON, respond JSON; else HTML page.
      const accept = String(req.headers.accept || '');
      if (accept.includes('application/json')) {
        return sendJson(res, 200, { ok: true, order_id: inserted.id, errors });
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderThankYou(merchant, inserted.id));
    } catch (err) {
      console.error('[order create]', err);
      sendJson(res, 500, { error: 'internal' });
    }
  });

  router.get('/dashboard/orders', async (req, res) => {
    const m = await getRequestMerchant(req);
    if (!m) return redirect(res, '/login');
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const tab = url.searchParams.get('tab') || 'pending';
    const valid = ['pending', 'confirmed', 'shipped', 'cancelled'];
    const activeTab = valid.includes(tab) ? tab : 'pending';

    const [orders, cP, cC, cS, cX] = await Promise.all([
      query('SELECT * FROM orders WHERE merchant_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 200',
        [m.id, activeTab]),
      queryOne(`SELECT COUNT(*)::int AS n FROM orders WHERE merchant_id = $1 AND status = 'pending'`, [m.id]),
      queryOne(`SELECT COUNT(*)::int AS n FROM orders WHERE merchant_id = $1 AND status = 'confirmed'`, [m.id]),
      queryOne(`SELECT COUNT(*)::int AS n FROM orders WHERE merchant_id = $1 AND status = 'shipped'`, [m.id]),
      queryOne(`SELECT COUNT(*)::int AS n FROM orders WHERE merchant_id = $1 AND status = 'cancelled'`, [m.id]),
    ]);

    const counts = { pending: cP.n, confirmed: cC.n, shipped: cS.n, cancelled: cX.n };
    const body = ordersListBody(orders, activeTab, counts);
    sendHtml(res, 200, dashboardPage({
      title: 'الطلبات',
      subtitle: `${counts.pending} طلب جديد ينتظر تأكيدك`,
      activeKey: 'orders',
      merchant: m,
      body,
    }));
  });

  router.post('/dashboard/orders/:id/confirm', async (req, res, params) => {
    const m = await getRequestMerchant(req);
    if (!m) return redirect(res, '/login');
    await exec(`UPDATE orders SET status = 'confirmed' WHERE id = $1 AND merchant_id = $2 AND status = 'pending'`,
      [Number(params.id), m.id]);
    redirect(res, '/dashboard/orders?tab=confirmed');
  });

  router.post('/dashboard/orders/:id/ship', async (req, res, params) => {
    const m = await getRequestMerchant(req);
    if (!m) return redirect(res, '/login');
    const id = Number(params.id);
    const order = await queryOne(`SELECT * FROM orders WHERE id = $1 AND merchant_id = $2`, [id, m.id]);
    if (!order || (order.status !== 'confirmed' && order.status !== 'pending')) {
      return redirect(res, '/dashboard/orders?tab=confirmed');
    }
    // Record each item as a sale transaction for accurate revenue/reporting.
    const items = Array.isArray(order.items) ? order.items : [];
    for (const it of items) {
      await exec(
        `INSERT INTO transactions (merchant_id, type, product_id, product_name, quantity, amount, note)
         VALUES ($1, 'sale', $2, $3, $4, $5, $6)`,
        [m.id, it.product_id, it.name, it.quantity, it.line_total, `Order #${id}`]
      );
    }
    await exec(`UPDATE orders SET status = 'shipped' WHERE id = $1`, [id]);
    redirect(res, '/dashboard/orders?tab=shipped');
  });

  router.post('/dashboard/orders/:id/cancel', async (req, res, params) => {
    const m = await getRequestMerchant(req);
    if (!m) return redirect(res, '/login');
    const id = Number(params.id);
    const order = await queryOne(`SELECT * FROM orders WHERE id = $1 AND merchant_id = $2`, [id, m.id]);
    if (!order) return redirect(res, '/dashboard/orders');
    if (order.status === 'cancelled' || order.status === 'shipped') {
      return redirect(res, '/dashboard/orders?tab=' + order.status);
    }
    if (!order.stock_returned) {
      try { await returnStockForOrder(order); } catch (e) { console.error('[cancel stock return]', e); }
    }
    await exec(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [id]);
    redirect(res, '/dashboard/orders?tab=cancelled');
  });
}

module.exports = { registerRoutes, pendingCount };
