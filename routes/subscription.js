// subscription.js — merchant-facing subscription page at /dashboard/subscription.
// Shows current plan, days left, and upgrade CTAs. Upgrade = opens WhatsApp
// with a pre-filled message to the platform owner (manual activation for now).

const { getMerchantFromToken, parseCookies } = require('../lib/auth');
const { queryOne } = require('../lib/db');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { renderPricingPage } = require('../lib/pricing-page');
const { daysLeft, bucket } = require('../lib/subscription');
const { getPlan, allPlans } = require('../lib/plans');
const { dashboardPage } = require('../lib/view');

const OWNER_WHATSAPP = '201040773728';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
}

function upgradeLink(planId, cycle, merchant) {
  const plan = getPlan(planId);
  const price = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const msg = `السلام عليكم، أنا ${merchant.name} صاحب متجر "${merchant.store_name}" (رقمي: ${merchant.phone}).\nعاوز أشترك في باقه ${plan.name} (${cycle === 'yearly' ? 'سنوي' : 'شهري'}) — ${price} ج.م.\nياريت تبعتوا طرق الدفع.`;
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function renderSubscriptionPage(merchant) {
  const dl = daysLeft(merchant.subscription_expires_at);
  const b = bucket(merchant);
  const plan = getPlan(merchant.subscription_plan);
  const isExpired = b === 'expired';
  const isUrgent = b === 'urgent' || b === 'warning';

  const bannerColor = isExpired ? '#FEE2E2' : (isUrgent ? '#FEF3C7' : '#D1FAE5');
  const bannerBorder = isExpired ? '#DC2626' : (isUrgent ? '#F59E0B' : '#10B981');
  const bannerText = isExpired ? '#991B1B' : (isUrgent ? '#92400E' : '#065F46');
  const bannerIcon = isExpired ? '⛔' : (isUrgent ? '⚠️' : '✅');
  const bannerMsg = isExpired
    ? 'اشتراكك انتهى — صفحه متجرك العامه مقفوله دلوقتي. جدد اشتراكك علشان يشتغل تاني.'
    : (isUrgent
      ? `اشتراكك بيخلص خلال ${dl} يوم — جدد دلوقتي علشان متجرك يفضل شغال.`
      : `اشتراكك فعّال وباقي ${dl} يوم على انتهائه.`);

  const paidPlans = allPlans().filter((p) => p.id !== 'trial');
  const upgradeCards = paidPlans.map((p) => `
    <div class="plan-card ${p.highlight ? 'highlight' : ''}">
      ${p.highlight ? '<div class="pop">الأكثر شعبيه ⭐</div>' : ''}
      <h3>${esc(p.name)}</h3>
      <p class="tag">${esc(p.tagline)}</p>
      <div class="price"><span class="n">${p.priceMonthly}</span><span class="u">ج.م / شهر</span></div>
      <div class="yearly">أو <strong>${p.priceYearly} ج.م / سنه</strong> (وفّر 17٪)</div>
      <ul>${p.features.slice(0, 5).map((f) => `<li class="${f.ok ? 'ok' : 'no'}">${f.ok ? '✓' : '✕'} ${esc(f.text)}</li>`).join('')}</ul>
      <div class="btns">
        <a class="btn primary" href="${upgradeLink(p.id, 'monthly', merchant)}" target="_blank">📱 اشترك شهري</a>
        <a class="btn" href="${upgradeLink(p.id, 'yearly', merchant)}" target="_blank">اشترك سنوي</a>
      </div>
    </div>`).join('');

  const body = `
  <style>
    .sub-wrap{max-width:960px;margin:0 auto;padding:20px}
    .sub-banner{background:${bannerColor};border:2px solid ${bannerBorder};color:${bannerText};padding:18px 22px;border-radius:14px;margin-bottom:20px;font-weight:700;font-size:15px;display:flex;align-items:center;gap:12px}
    .sub-banner .ic{font-size:26px}
    .current-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:22px;margin-bottom:22px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .current-card h2{margin:0 0 16px;font-size:17px;font-weight:800;padding-bottom:12px;border-bottom:1px solid var(--border)}
    .kv{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed var(--border);font-size:14.5px}
    .kv:last-child{border:none}
    .kv .k{color:var(--muted);font-weight:600}
    .kv .v{color:var(--text);font-weight:700}
    .plans-title{font-size:20px;font-weight:800;margin:30px 0 16px;text-align:center}
    .plans-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
    @media (max-width:700px){.plans-grid{grid-template-columns:1fr}}
    .plan-card{background:#fff;border:2px solid var(--border);border-radius:16px;padding:24px;position:relative;transition:transform .15s,border-color .15s}
    .plan-card:hover{transform:translateY(-3px)}
    .plan-card.highlight{border-color:#4F46E5;box-shadow:0 12px 30px rgba(79,70,229,.12)}
    .plan-card .pop{position:absolute;top:-12px;right:20px;background:linear-gradient(135deg,#4F46E5,#EC4899);color:#fff;padding:4px 12px;border-radius:20px;font-size:11.5px;font-weight:800}
    .plan-card h3{margin:0 0 4px;font-size:20px;font-weight:800}
    .plan-card .tag{color:var(--muted);font-size:13px;margin:0 0 14px}
    .plan-card .price{margin-bottom:2px}
    .plan-card .price .n{font-size:32px;font-weight:900;color:var(--text)}
    .plan-card .price .u{color:var(--muted);font-size:13px;margin-inline-start:6px}
    .plan-card .yearly{color:#059669;font-size:12.5px;margin-bottom:14px;font-weight:600}
    .plan-card ul{list-style:none;padding:0;margin:0 0 16px;font-size:13.5px}
    .plan-card ul li{padding:5px 0;color:var(--text)}
    .plan-card ul li.no{color:#94A3B8;text-decoration:line-through}
    .plan-card .btns{display:flex;gap:8px;flex-direction:column}
    .plan-card .btn{display:block;text-align:center;padding:10px;border-radius:10px;font-weight:700;text-decoration:none;font-size:14px;border:1.5px solid var(--border);background:#fff;color:var(--text)}
    .plan-card .btn.primary{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border-color:transparent}
    .plan-card .btn:hover{transform:scale(1.02)}
    .payment-note{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px 16px;margin-top:22px;font-size:13.5px;color:#1E40AF;line-height:1.7}
    .payment-note strong{color:#1E3A8A}
  </style>

  <div class="sub-wrap">
    <div class="sub-banner">
      <span class="ic">${bannerIcon}</span>
      <span>${esc(bannerMsg)}</span>
    </div>

    <div class="current-card">
      <h2>الاشتراك الحالي</h2>
      <div class="kv"><span class="k">الباقه</span><span class="v">${esc(plan.name)}</span></div>
      <div class="kv"><span class="k">الحاله</span><span class="v">${
        merchant.subscription_status === 'trial' ? '🆕 تجريبي' :
        merchant.subscription_status === 'active' ? '✅ فعّال' :
        merchant.subscription_status === 'expired' ? '⛔ منتهي' : '❌ ملغي'
      }</span></div>
      <div class="kv"><span class="k">ينتهي في</span><span class="v">${fmtDate(merchant.subscription_expires_at)}</span></div>
      <div class="kv"><span class="k">الأيام المتبقيه</span><span class="v" style="color:${isExpired ? '#DC2626' : (isUrgent ? '#F59E0B' : '#10B981')};font-size:17px">${dl > 0 ? dl + ' يوم' : 'انتهى'}</span></div>
    </div>

    <h2 class="plans-title">اختار باقتك</h2>
    <div class="plans-grid">${upgradeCards}</div>

    <div class="payment-note">
      💡 <strong>طرق الدفع:</strong> بعد ما تدوس على "اشترك"، هيتفتحلك واتساب برساله جاهزه لصاحب المنصه. هنرد عليك بطرق الدفع (تحويل بنكي / فوري / فودافون كاش / إنستاباي)، وبعد التأكيد اشتراكك بيتفعّل خلال ساعات.
    </div>
  </div>`;

  return dashboardPage({
    title: 'الاشتراك',
    subtitle: 'خطتك، وترقيتها',
    activeKey: 'subscription',
    merchant,
    body,
  });
}

function registerRoutes(router) {
  router.get('/pricing', (req, res) => sendHtml(res, 200, renderPricingPage()));

  router.get('/dashboard/subscription', async (req, res) => {
    const cookies = parseCookies(req);
    const merchant = await getMerchantFromToken(cookies.session);
    if (!merchant) return redirect(res, '/login');
    // Re-fetch to get the latest subscription fields (auth may cache).
    const fresh = await queryOne('SELECT * FROM merchants WHERE id = $1', [merchant.id]);
    sendHtml(res, 200, renderSubscriptionPage(fresh || merchant));
  });
}

module.exports = { registerRoutes };
