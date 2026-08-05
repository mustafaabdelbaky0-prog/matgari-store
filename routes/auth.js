const { queryOne, exec } = require('../lib/db');
const { getRequestMerchant } = require('../lib/req-context');
const { hashPassword, verifyPassword, createSession, destroySession, uniqueSlug, setCookie, parseCookies, SESSION_MAX_AGE_SECONDS } = require('../lib/auth');
const { page, esc, CATEGORIES } = require('../lib/view');
const { parseBody } = require('../lib/body');
const { sendHtml, redirect, getClientIp } = require('../lib/http-helpers');
const rateLimit = require('../lib/rate-limit');

const LOGIN_MAX_PER_PHONE = 8;   // failed attempts
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_PER_IP = 30;     // broader guard against credential stuffing across many numbers
const REGISTER_MAX_PER_IP = 6;
const REGISTER_WINDOW_SECONDS = 60 * 60;

function authLayout({ title, subtitle, body, error, success }) {
  return page({
    title,
    body: `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-logo">🛍️</div>
        <div class="auth-title">${esc(title)}</div>
        <div class="auth-sub">${esc(subtitle)}</div>
        <div class="card">
          ${error ? `<div class="error-box">${esc(error)}</div>` : ''}
          ${success ? `<div class="success-box">${esc(success)}</div>` : ''}
          ${body}
        </div>
      </div>
    </div>`,
  });
}

function registerRoutes(router) {
  router.get('/register', (req, res) => {
    sendHtml(res, 200, authLayout({
      title: 'ابدأ متجرك',
      subtitle: 'سجّل بياناتك عشان تبدأ تدير مبيعاتك في دقيقة',
      body: `
      <form method="POST" action="/register">
        <div class="field"><label>اسمك</label><input type="text" name="name" required placeholder="مثال: أحمد محمد"></div>
        <div class="field"><label>اسم المتجر</label><input type="text" name="store_name" required placeholder="مثال: متجر لمسة"></div>
        <div class="field"><label>رقم الموبايل</label><input type="tel" name="phone" required placeholder="01xxxxxxxxx"></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="password" required minlength="8" placeholder="8 أحرف أو أكتر"></div>
        <button class="btn btn-primary" type="submit">إنشاء الحساب</button>
        <p style="font-size:12px;color:#64748B;text-align:center;margin:12px 0 0;line-height:1.6">بإنشاء الحساب أنت بتوافق على <a href="/terms" target="_blank" style="color:#4F46E5;font-weight:600">شروط الاستخدام</a> و<a href="/privacy" target="_blank" style="color:#4F46E5;font-weight:600">سياسه الخصوصيه</a></p>
      </form>
      <div class="auth-switch">عندك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a></div>
      `,
    }));
  });

  router.post('/register', async (req, res) => {
    const b = await parseBody(req);
    const name = (b.name || '').trim();
    const storeName = (b.store_name || '').trim();
    const phone = (b.phone || '').trim();
    const password = (b.password || '').trim();

    const fail = (msg) => sendHtml(res, 400, authLayout({
      title: 'ابدأ متجرك',
      subtitle: 'سجّل بياناتك عشان تبدأ تدير مبيعاتك في دقيقة',
      error: msg,
      body: `
      <form method="POST" action="/register">
        <div class="field"><label>اسمك</label><input type="text" name="name" required value="${esc(name)}"></div>
        <div class="field"><label>اسم المتجر</label><input type="text" name="store_name" required value="${esc(storeName)}"></div>
        <div class="field"><label>رقم الموبايل</label><input type="tel" name="phone" required value="${esc(phone)}"></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="password" required minlength="8"></div>
        <button class="btn btn-primary" type="submit">إنشاء الحساب</button>
        <p style="font-size:12px;color:#64748B;text-align:center;margin:12px 0 0;line-height:1.6">بإنشاء الحساب أنت بتوافق على <a href="/terms" target="_blank" style="color:#4F46E5;font-weight:600">شروط الاستخدام</a> و<a href="/privacy" target="_blank" style="color:#4F46E5;font-weight:600">سياسه الخصوصيه</a></p>
      </form>
      <div class="auth-switch">عندك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a></div>
      `,
    }));

    // Guard against automated mass account creation from a single source.
    const ip = getClientIp(req);
    const recentFromIp = await rateLimit.count('register', ip, REGISTER_WINDOW_SECONDS);
    if (recentFromIp >= REGISTER_MAX_PER_IP) {
      return fail('في محاولات تسجيل كتير من نفس المكان في وقت قصير، حاول تاني بعد شوية');
    }
    await rateLimit.hit('register', ip);

    if (!name || !storeName || !phone || !password) return fail('من فضلك املأ كل البيانات');
    if (password.length < 8) return fail('كلمة المرور لازم تكون 8 أحرف على الأقل');

    const existing = await queryOne('SELECT id FROM merchants WHERE phone = $1', [phone]);
    if (existing) return fail('في حساب مسجل بالرقم ده بالفعل، جرب تسجيل الدخول');

    const slug = await uniqueSlug(storeName);
    const passwordHash = hashPassword(password);
    const inserted = await queryOne(
      'INSERT INTO merchants (name, phone, password_hash, store_name, slug) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, phone, passwordHash, storeName, slug]
    );

    const token = await createSession(inserted.id);
    setCookie(res, 'session', token, { maxAge: SESSION_MAX_AGE_SECONDS });
    redirect(res, '/onboarding');
  });

  router.get('/login', (req, res) => {
    sendHtml(res, 200, authLayout({
      title: 'أهلاً بيك تاني',
      subtitle: 'سجّل دخولك عشان تكمل شغلك في متجرك',
      body: `
      <form method="POST" action="/login">
        <div class="field"><label>رقم الموبايل</label><input type="tel" name="phone" required placeholder="01xxxxxxxxx"></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="password" required></div>
        <button class="btn btn-primary" type="submit">دخول</button>
      </form>
      <div class="auth-switch">لسه مالكش حساب؟ <a href="/register">سجّل متجرك دلوقتي</a></div>
      `,
    }));
  });

  router.post('/login', async (req, res) => {
    const b = await parseBody(req);
    const phone = (b.phone || '').trim();
    const password = (b.password || '').trim();

    const fail = (msg) => sendHtml(res, 400, authLayout({
      title: 'أهلاً بيك تاني',
      subtitle: 'سجّل دخولك عشان تكمل شغلك في متجرك',
      error: msg || 'رقم الموبايل أو كلمة المرور مش صح',
      body: `
      <form method="POST" action="/login">
        <div class="field"><label>رقم الموبايل</label><input type="tel" name="phone" required value="${esc(phone)}"></div>
        <div class="field"><label>كلمة المرور</label><input type="password" name="password" required></div>
        <button class="btn btn-primary" type="submit">دخول</button>
      </form>
      <div class="auth-switch">لسه مالكش حساب؟ <a href="/register">سجّل متجرك دلوقتي</a></div>
      `,
    }));

    // Two layers: per-phone (stops guessing one account's password) and
    // per-IP (stops one source from grinding through many phone numbers).
    const ip = getClientIp(req);
    const [failsForPhone, failsForIp] = await Promise.all([
      phone ? rateLimit.count('login_fail', phone, LOGIN_WINDOW_SECONDS) : 0,
      rateLimit.count('login_fail_ip', ip, LOGIN_WINDOW_SECONDS),
    ]);
    if (failsForPhone >= LOGIN_MAX_PER_PHONE || failsForIp >= LOGIN_MAX_PER_IP) {
      return fail('محاولات كتير غلط، حاول تاني بعد شوية');
    }

    const merchant = await queryOne('SELECT * FROM merchants WHERE phone = $1', [phone]);
    if (!merchant || !verifyPassword(password, merchant.password_hash)) {
      await Promise.all([
        phone ? rateLimit.hit('login_fail', phone) : null,
        rateLimit.hit('login_fail_ip', ip),
      ]);
      return fail();
    }

    const token = await createSession(merchant.id);
    setCookie(res, 'session', token, { maxAge: SESSION_MAX_AGE_SECONDS });
    redirect(res, merchant.onboarded ? '/dashboard' : '/onboarding');
  });

  router.post('/logout', async (req, res) => {
    const cookies = parseCookies(req);
    await destroySession(cookies.session);
    // Send Set-Cookie directly to avoid any helper-header ordering issues.
    res.setHeader('Set-Cookie', [
      'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
      'session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
    ]);
    res.setHeader('Location', '/login');
    res.statusCode = 302;
    res.end();
  });


  router.get('/logout', async (req, res) => {
    // Convenience GET so you can just visit /logout to end a session.
    const cookies = parseCookies(req);
    await destroySession(cookies.session);
    res.setHeader('Set-Cookie', [
      'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
      'session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
    ]);
    res.setHeader('Location', '/login');
    res.statusCode = 302;
    res.end();
  });

  router.get('/onboarding', async (req, res) => {
    const merchant = await getRequestMerchant(req);
    if (!merchant) return redirect(res, '/login');
    sendHtml(res, 200, authLayout({
      title: 'متجرك بيبيع إيه؟',
      subtitle: 'اختار المجال عشان نظبطلك صفحة البيع والمخزون صح',
      body: `
      <form method="POST" action="/onboarding">
        <div class="cat-grid">
          ${CATEGORIES.map((c, i) => `
            <label class="cat-option">
              <input type="radio" name="category" value="${c.id}" ${i === 0 ? 'checked' : ''}>
              <span class="emoji">${c.emoji}</span>
              <span class="label">${esc(c.label)}</span>
            </label>
          `).join('')}
        </div>
        <div class="field">
          <label>رقم واتساب لاستقبال الأوردرات (اختياري)</label>
          <input type="tel" name="whatsapp" placeholder="01xxxxxxxxx">
          <div class="hint">هيظهر زرار "اطلب الآن" في صفحة البيع بتاعتك ويودّي العميل لواتساب على الرقم ده</div>
        </div>
        <button class="btn btn-primary" type="submit">كمّل لمتجري</button>
      </form>
      `,
    }));
  });

  router.post('/onboarding', async (req, res) => {
    const merchant = await getRequestMerchant(req);
    if (!merchant) return redirect(res, '/login');
    const b = await parseBody(req);
    const category = b.category || 'other';
    const whatsapp = (b.whatsapp || '').trim();
    await exec(
      'UPDATE merchants SET category = $1, whatsapp = $2, onboarded = 1 WHERE id = $3',
      [category, whatsapp, merchant.id]
    );
    redirect(res, '/dashboard');
  });
}

module.exports = { registerRoutes };
