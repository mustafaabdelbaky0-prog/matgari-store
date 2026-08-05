const { query, queryOne } = require('../lib/db');
const { page, esc, money, categoryLabel } = require('../lib/view');
const { sendHtml } = require('../lib/http-helpers');
const { renderKidsLanding } = require('../lib/kids-landing');
const { renderThemedLanding } = require('../lib/themed-landing');
const { getCategoryConfig } = require('../lib/category-configs');
const { isActive } = require('../lib/subscription');

function renderClosedStore(merchant) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(merchant.store_name)} — متجر مغلق مؤقتًا</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;font-family:'Cairo',sans-serif;background:linear-gradient(135deg,#F8FAFC,#EEF2FF);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;color:#0F172A}
  .box{background:#fff;border-radius:20px;padding:40px 30px;max-width:460px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,.12)}
  .ic{font-size:56px;margin-bottom:14px}
  h1{margin:0 0 10px;font-size:24px}
  p{color:#475569;line-height:1.75;margin:0 0 20px;font-size:15px}
  .store{font-weight:700;color:#4F46E5}
  .btn{display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;margin-top:8px}
</style></head><body>
<div class="box">
  <div class="ic">🔒</div>
  <h1>المتجر مغلق مؤقتًا</h1>
  <p>متجر <span class="store">${esc(merchant.store_name)}</span> غير متاح للطلبات في الوقت الحالي.<br>لو صاحب المتجر ده انت، سجّل دخولك عشان تجدد اشتراكك.</p>
  <a class="btn" href="/">🏠 الرجوع لمتجري</a>
</div>
</body></html>`;
}

function registerRoutes(router) {
  router.get('/store/:slug', async (req, res, params) => {
    const merchant = await queryOne('SELECT * FROM merchants WHERE slug = $1', [params.slug]);
    if (!merchant) {
      return sendHtml(res, 404, page({
        title: 'المتجر غير موجود',
        body: `<div class="empty" style="padding-top:80px;"><div class="big">🔍</div>الرابط ده مش موجود أو اتغيّر</div>`,
      }));
    }

    // Enforce subscription: closed page when trial expired / status cancelled.
    if (!isActive(merchant)) {
      return sendHtml(res, 200, renderClosedStore(merchant));
    }

    const products = await query(
      'SELECT * FROM products WHERE merchant_id = $1 AND visible = 1 ORDER BY id DESC',
      [merchant.id]
    );

    const host = req.headers.host || '';

    // Kids clothing keeps the dedicated Laila-style renderer.
    if (merchant.category === 'kids') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderKidsLanding(merchant, products, host));
      return;
    }

    // Any other configured category uses the themed renderer.
    if (getCategoryConfig(merchant.category)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderThemedLanding(merchant, products, host));
      return;
    }

    // Fallback: minimal listing for categories without a config (e.g. "other").
    const wa = (merchant.whatsapp || '').replace(/[^0-9]/g, '');
    const waNumber = wa ? (wa.startsWith('20') ? wa : wa.startsWith('0') ? `2${wa}` : `20${wa}`) : '';

    const body = `
      <div class="store-hero">
        <div class="logo">🛍️</div>
        <h1>${esc(merchant.store_name)}</h1>
        <div class="cat">${categoryLabel(merchant.category)}</div>
      </div>

      <div class="section-title">المنتجات (${products.length})</div>

      ${products.length === 0 ? `
        <div class="empty" style="padding-top:40px;"><div class="big">🛍️</div>لسه مفيش منتجات متاحة، تابعنا قريب</div>
      ` : `
        <div class="product-grid">
          ${products.map((p) => {
            const msg = encodeURIComponent(`أهلاً، عايز أطلب: ${p.name} (${money(p.sell_price)})`);
            const orderHref = waNumber ? `https://wa.me/${waNumber}?text=${msg}` : '#';
            return `
            <div class="product-card">
              <div class="img">${p.image ? `<img src="${p.image}">` : '🛍️'}</div>
              <div class="info">
                <div class="name">${esc(p.name)}</div>
                <div class="price">${money(p.sell_price)}</div>
                ${waNumber
                  ? `<a class="order-btn" href="${orderHref}" target="_blank">💬 اطلب الآن</a>`
                  : `<span class="order-btn" style="background:var(--border);color:var(--muted);">اطلب الآن</span>`}
              </div>
            </div>`;
          }).join('')}
        </div>
      `}

      <div class="footer-note">صفحة بيع بواسطة متجري 🛍️</div>
    `;

    const ogImage = host ? `https://${host}/icons/icon-512.png` : '/icons/icon-512.png';
    const extraHead = `
      <meta property="og:type" content="website">
      <meta property="og:title" content="${esc(merchant.store_name)}">
      <meta property="og:description" content="اكتشف منتجات ${esc(merchant.store_name)} واطلب دلوقتي">
      <meta property="og:image" content="${ogImage}">
      <meta name="twitter:card" content="summary_large_image">
    `;
    sendHtml(res, 200, page({ title: merchant.store_name, body, extraHead }));
  });
}

module.exports = { registerRoutes };
