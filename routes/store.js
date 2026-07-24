const db = require('../lib/db');
const { page, esc, money, categoryLabel } = require('../lib/view');
const { sendHtml } = require('../lib/http-helpers');

function registerRoutes(router) {
  router.get('/store/:slug', (req, res, params) => {
    const merchant = db.prepare('SELECT * FROM merchants WHERE slug = ?').get(params.slug);
    if (!merchant) {
      return sendHtml(res, 404, page({
        title: 'المتجر غير موجود',
        body: `<div class="empty" style="padding-top:80px;"><div class="big">🔍</div>الرابط ده مش موجود أو اتغيّر</div>`,
      }));
    }

    const products = db.prepare('SELECT * FROM products WHERE merchant_id = ? AND visible = 1 ORDER BY id DESC').all(merchant.id);
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

    sendHtml(res, 200, page({ title: merchant.store_name, body }));
  });
}

module.exports = { registerRoutes };
