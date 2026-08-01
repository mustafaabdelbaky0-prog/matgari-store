const { exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { dashboardPage, esc, CATEGORIES } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function coerceSections(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch (e) { return []; } }
  return [];
}

function registerRoutes(router) {
  router.get('/dashboard/settings', async (req, res) => {
    const m = await getRequestMerchant(req);
    const storeUrl = `${req.headers.host}/store/${m.slug}`;
    const sections = coerceSections(m.sections);

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
        <div class="card-title">أقسام صفحه المتجر</div>
        <div class="hint" style="margin-bottom:12px;">
          الأقسام دي هتظهر كفلاتر في اللاندج بيدج بتاعتك، ولما تضيف منتج تقدر تحطه في القسم بتاعه.
        </div>
        ${sections.length === 0 ? `<div class="empty" style="padding:20px 10px;"><div>🏷️</div>لسه معملتش أي قسم — ابدأ إضافة قسم من تحت</div>` : `
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
            ${sections.map((s, i) => `
              <div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;padding:6px 14px;">
                <span style="font-size:13.5px;font-weight:600;">${esc(s)}</span>
                <form method="POST" action="/dashboard/settings/sections/delete" style="display:inline;">
                  <input type="hidden" name="index" value="${i}">
                  <button type="submit" style="background:none;border:none;color:#dc2626;font-size:16px;cursor:pointer;padding:0;line-height:1;" title="حذف">✕</button>
                </form>
              </div>
            `).join('')}
          </div>
        `}
        <form method="POST" action="/dashboard/settings/sections/add">
          <div style="display:flex;gap:8px;">
            <input type="text" name="name" required placeholder="مثال: عروض الصيف، وصل حديثًا، للأولاد..."
              style="flex:1;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;">
            <button class="btn btn-primary" type="submit" style="white-space:nowrap;">➕ إضافة قسم</button>
          </div>
        </form>
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
    const m = await getRequestMerchant(req);
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

  router.post('/dashboard/settings/sections/add', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    const name = (b.name || '').trim();
    if (!name) return redirect(res, '/dashboard/settings');
    const sections = coerceSections(m.sections);
    if (!sections.includes(name)) sections.push(name);
    await exec('UPDATE merchants SET sections = $1::jsonb WHERE id = $2', [JSON.stringify(sections), m.id]);
    redirect(res, '/dashboard/settings');
  });

  router.post('/dashboard/settings/sections/delete', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    const idx = parseInt(b.index, 10);
    const sections = coerceSections(m.sections);
    if (!Number.isNaN(idx) && idx >= 0 && idx < sections.length) {
      sections.splice(idx, 1);
      await exec('UPDATE merchants SET sections = $1::jsonb WHERE id = $2', [JSON.stringify(sections), m.id]);
    }
    redirect(res, '/dashboard/settings');
  });
}

module.exports = { registerRoutes };
