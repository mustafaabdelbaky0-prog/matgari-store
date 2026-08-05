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
        <div class="card-title">🔔 إشعارات الطلبات</div>
        <p class="small muted">اختار إزاي تحب توصلك الطلبات الجديده لحد ما تتاكد. الطلب دايمًا بيتحفظ في داشبوردك.</p>
        <form method="POST" action="/dashboard/settings/notifications" style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer">
            <input type="checkbox" name="channels" value="dashboard" checked disabled>
            <span><strong>الداشبورد</strong> — دايمًا مفعّل (البادج الأحمر في الرئيسيه)</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer">
            <input type="checkbox" name="channels" value="email" ${(Array.isArray(m.notify_channels) ? m.notify_channels : []).includes('email') ? 'checked' : ''}>
            <span><strong>📧 إيميل (Gmail)</strong> — إشعار فوري بكل الطلبات</span>
          </label>
          <input type="email" name="notify_email" value="${esc(m.notify_email || '')}" placeholder="ايميلك على Gmail" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;margin-bottom:10px">

          <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer">
            <input type="checkbox" name="channels" value="telegram" ${(Array.isArray(m.notify_channels) ? m.notify_channels : []).includes('telegram') ? 'checked' : ''}>
            <span><strong>💬 تليجرام</strong> — أسرع طريقه، إشعار فوري لموبايلك</span>
          </label>
          <input type="text" name="notify_telegram_chat_id" value="${esc(m.notify_telegram_chat_id || '')}" placeholder="Telegram Chat ID (شوف التعليمات تحت)" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;margin-bottom:10px;direction:ltr;text-align:left">
          <div style="background:#EEF2FF;color:#3730A3;padding:10px 12px;border-radius:8px;font-size:12.5px;line-height:1.7;margin-bottom:10px">
            <strong>إزاي أجيب Chat ID:</strong><br>
            1. افتح تليجرام وابحث عن <a href="https://t.me/userinfobot" target="_blank" style="color:#4F46E5;font-weight:700">@userinfobot</a><br>
            2. ابدأ محادثه معاه — هيبعتلك Chat ID بتاعك (رقم)<br>
            3. انسخه هنا واحفظ<br>
            4. ابحث عن بوت متجري وابعتله /start
          </div>

          <button class="btn btn-primary" type="submit">💾 حفظ إعدادات الإشعارات</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">الاشتراك</div>
        <p class="small muted">شوف تفاصيل باقتك، وإداره الترقيه والتجديد</p>
        <a class="btn btn-primary" href="/dashboard/subscription" style="margin-top:10px;display:inline-block;text-decoration:none">💳 صفحه الاشتراك</a>
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

  router.post('/dashboard/settings/notifications', async (req, res) => {
    const m = await getRequestMerchant(req);
    const b = await parseBody(req);
    // channels may be a string (single) or array (multiple checked); parseBody
    // will hand us either shape.
    let channels = b.channels;
    if (!channels) channels = [];
    else if (!Array.isArray(channels)) channels = [channels];
    // Always keep 'dashboard' — it's the safety net.
    if (!channels.includes('dashboard')) channels.push('dashboard');
    const email = (b.notify_email || '').trim().slice(0, 200) || null;
    const telegramId = (b.notify_telegram_chat_id || '').trim().slice(0, 60) || null;
    await exec(
      'UPDATE merchants SET notify_channels = $1::jsonb, notify_email = $2, notify_telegram_chat_id = $3 WHERE id = $4',
      [JSON.stringify(channels), email, telegramId, m.id]
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
