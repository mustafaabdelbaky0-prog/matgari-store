const { exec } = require('../lib/db');
const { dashboardPage, esc, CATEGORIES } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function registerRoutes(router) {
  router.get('/dashboard/settings', (req, res) => {
    const m = req.merchant;
    const storeUrl = `${req.headers.host}/store/${m.slug}`;

    const body = `
      <div class="card text-center">
        <div class="card-title">رابط صفحة البيع بتاعتك</div>
        <div class="link-box"><span class="url">${storeUrl}</span></div>
        <div class="grid-2 mt-16">
          <button class="btn btn-outline" data-copy="${storeUrl}">📋 نسخ الرابط</button>
          <a href="/store/${m.slug}" target="_blank" class="btn btn-outline">👀 معاينة</a>
        </div>
        <div class="hint mt-8">شارك الرابط ده مع عملائك على السوشيال ميديا، وأي منتج تضيفه هيظهر عليه أوتوماتيك</div>
      </div>

      <div class="card">
        <div class="card-title">بيانات المتجر</div>
        <form method="POST" action="/dashboard/settings">
          <div class="field">
            <label>اسم المتجر</label>
            <input type="text" name="store_name" required value="${esc(m.store_name)}">
          </div>
          <div class="field">
            <label>مجال المتجر</label>
            <select name="category">
              ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === m.category ? 'selected' : ''}>${c.emoji} ${esc(c.label)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>رقم واتساب استقبال الأوردرات</label>
            <input type="tel" name="whatsapp" value="${esc(m.whatsapp || '')}" placeholder="01xxxxxxxxx">
          </div>
          <button class="btn btn-primary" type="submit">حفظ التعديلات</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">الحساب</div>
        <p class="small muted">${esc(m.name)} · ${esc(m.phone)}</p>
        <form method="POST" action="/logout" style="margin-top:12px;">
          <button class="btn btn-danger" type="submit">🚪 تسجيل الخروج</button>
        </form>
      </div>

      <div class="footer-note">اتعمل بحب عشان يسهّل عليك تبدأ تبيع أونلاين ✨</div>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'الإعدادات', merchant: m, activeKey: 'settings', subtitle: 'إعدادات متجرك', body }));
  });

  router.post('/dashboard/settings', async (req, res) => {
    const m = req.merchant;
    const b = await parseBody(req);
    const storeName = (b.store_name || '').trim() || m.store_name;
    const category = b.category || m.category;
    const whatsapp = (b.whatsapp || '').trim();

    await exec(
      'UPDATE merchants SET store_name = $1, category = $2, whatsapp = $3 WHERE id = $4',
      [storeName, category, whatsapp, m.id]
    );

    redirect(res, '/dashboard/settings');
  });
}

module.exports = { registerRoutes };
