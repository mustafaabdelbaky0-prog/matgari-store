// pricing-page.js — public pricing page rendered at /pricing.

const { allPlans } = require('./plans');

const SUPPORT_WHATSAPP = '201040773728';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function planCard(plan, cycle) {
  const price = cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const unit = cycle === 'yearly' ? 'سنه' : 'شهر';
  const isTrial = plan.id === 'trial';
  const isPaid = !isTrial;
  const waMsg = encodeURIComponent(`السلام عليكم، عاوز أشترك في باقه ${plan.name} (${cycle === 'yearly' ? 'سنوي' : 'شهري'}) — ${price} ج.م`);
  const cta = isTrial
    ? `<a class="plan-cta" href="/register">${esc(plan.ctaLabel)}</a>`
    : `<a class="plan-cta primary" href="https://wa.me/${SUPPORT_WHATSAPP}?text=${waMsg}" target="_blank">${esc(plan.ctaLabel)}</a>`;

  return `
  <div class="plan ${plan.highlight ? 'highlight' : ''}">
    ${plan.highlight ? '<div class="badge">الأكثر شعبيه ⭐</div>' : ''}
    <div class="plan-name">${esc(plan.name)}</div>
    <div class="plan-tag">${esc(plan.tagline)}</div>
    <div class="plan-price">
      ${price === 0
        ? '<span class="free">مجانًا</span>'
        : `<span class="num">${price}</span><span class="unit">ج.م / ${unit}</span>`}
    </div>
    ${cycle === 'yearly' && plan.yearlyDiscount ? `<div class="discount">${esc(plan.yearlyDiscount)}</div>` : ''}
    <ul class="plan-feats">
      ${plan.features.map((f) => `
        <li class="${f.ok ? 'ok' : 'no'}">
          <span class="ic">${f.ok ? '✓' : '✕'}</span>
          <span>${esc(f.text)}</span>
        </li>`).join('')}
    </ul>
    ${cta}
  </div>`;
}

function renderPricingPage() {
  const plans = allPlans();
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>الأسعار — متجري</title>
<meta name="description" content="باقات متجري: تجريبي مجاني 30 يوم، أساسي 99 ج.م/شهر، برو 249 ج.م/شهر.">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{--ink:#0F172A;--ink-2:#475569;--ink-3:#94A3B8;--line:#E2E8F0;--brand:#4F46E5;--brand-2:#7C3AED;--accent:#EC4899;--success:#10B981;--bg:#F8FAFC}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Cairo',sans-serif;color:var(--ink);background:var(--bg);line-height:1.7}
  header{background:#fff;border-bottom:1px solid var(--line);padding:14px 0;position:sticky;top:0;z-index:20}
  .wrap{max-width:1100px;margin:0 auto;padding:0 20px}
  .h-inner{display:flex;justify-content:space-between;align-items:center;gap:12px}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
  .brand-mark{width:36px;height:36px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900}
  .brand-name{font-weight:800;font-size:18px}
  .h-actions{display:flex;gap:10px}
  .h-actions a{padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
  .h-actions .login{color:var(--brand)}
  .h-actions .cta{background:var(--brand);color:#fff}

  .hero{text-align:center;padding:60px 20px 30px}
  .hero h1{font-size:40px;font-weight:900;margin:0 0 12px;letter-spacing:-.02em}
  .hero h1 .accent{background:linear-gradient(135deg,var(--brand),var(--accent));-webkit-background-clip:text;background-clip:text;color:transparent}
  .hero p{font-size:17px;color:var(--ink-2);max-width:640px;margin:0 auto}

  .cycle-toggle{display:inline-flex;background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:5px;margin:26px auto 40px;box-shadow:0 2px 8px rgba(15,23,42,.04)}
  .cycle-toggle button{background:transparent;border:none;padding:9px 22px;border-radius:999px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;color:var(--ink-2);position:relative;display:inline-flex;align-items:center;gap:6px}
  .cycle-toggle button.active{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff}
  .save-tag{background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:800}
  .cycle-toggle button.active .save-tag{background:rgba(255,255,255,.25);color:#fff}
  .cycle-wrap{text-align:center}

  .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:20px auto 60px;padding:0 20px}
  @media (max-width:900px){.plans{grid-template-columns:1fr}}
  .plan{background:#fff;border:2px solid var(--line);border-radius:20px;padding:30px 26px;position:relative;display:flex;flex-direction:column;transition:transform .2s,border-color .2s,box-shadow .2s}
  .plan:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(15,23,42,.08)}
  .plan.highlight{border-color:var(--brand);box-shadow:0 20px 40px rgba(79,70,229,.15)}
  .plan.highlight:hover{transform:translateY(-6px)}
  .badge{position:absolute;top:-12px;right:24px;background:linear-gradient(135deg,var(--brand),var(--accent));color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:800;box-shadow:0 6px 14px rgba(79,70,229,.3)}
  .plan-name{font-size:22px;font-weight:900;color:var(--ink);margin:0 0 4px}
  .plan-tag{font-size:13.5px;color:var(--ink-2);margin:0 0 22px}
  .plan-price{margin:0 0 4px;min-height:44px}
  .plan-price .num{font-size:44px;font-weight:900;color:var(--ink);line-height:1}
  .plan-price .unit{font-size:14px;color:var(--ink-2);margin-inline-start:6px;font-weight:600}
  .plan-price .free{font-size:32px;font-weight:800;color:var(--success)}
  .discount{color:var(--success);font-size:13px;font-weight:700;margin:0 0 18px}
  .plan-feats{list-style:none;padding:0;margin:20px 0 22px;flex:1}
  .plan-feats li{display:flex;align-items:flex-start;gap:10px;padding:7px 0;font-size:14.5px;color:var(--ink)}
  .plan-feats li.no{color:var(--ink-3);text-decoration:line-through;opacity:.75}
  .plan-feats li .ic{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;margin-top:2px}
  .plan-feats li.ok .ic{background:#D1FAE5;color:#065F46}
  .plan-feats li.no .ic{background:#F3F4F6;color:#94A3B8}
  .plan-cta{display:block;text-align:center;background:#fff;color:var(--brand);border:2px solid var(--brand);padding:12px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;transition:background .15s,color .15s}
  .plan-cta:hover{background:var(--brand);color:#fff}
  .plan-cta.primary{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border-color:transparent}
  .plan-cta.primary:hover{filter:brightness(1.1)}

  .faq{max-width:820px;margin:0 auto 80px;padding:0 20px}
  .faq h2{text-align:center;font-size:28px;font-weight:800;margin:0 0 30px}
  .q{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:12px}
  .q h3{margin:0 0 8px;font-size:16px;font-weight:800;color:var(--brand)}
  .q p{margin:0;color:var(--ink-2);font-size:14.5px;line-height:1.7}

  .cta-strip{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;text-align:center;padding:44px 20px;margin:0 20px 40px;border-radius:20px;max-width:1060px;margin:0 auto 40px}
  .cta-strip h2{margin:0 0 10px;font-size:26px}
  .cta-strip p{margin:0 0 22px;opacity:.92;font-size:15px}
  .cta-strip a{display:inline-block;background:#fff;color:var(--brand);padding:12px 28px;border-radius:10px;font-weight:800;text-decoration:none}

  footer{text-align:center;padding:30px 20px;color:var(--ink-3);font-size:13px}
  footer a{color:var(--brand);text-decoration:none;margin:0 8px}
</style></head><body>
<header><div class="wrap h-inner">
  <a class="brand" href="/"><div class="brand-mark">م</div><div class="brand-name">متجري</div></a>
  <div class="h-actions">
    <a class="login" href="/login">دخول</a>
    <a class="cta" href="/register">ابدأ مجانًا</a>
  </div>
</div></header>

<section class="hero">
  <h1>باقات <span class="accent">متجري</span></h1>
  <p>ابدأ مجانًا 30 يوم، وبعدها اختار الباقه الي تناسبك. تقدر تلغي في أي وقت.</p>
  <div class="cycle-wrap">
    <div class="cycle-toggle">
      <button id="btn-monthly" class="active" onclick="setCycle('monthly')">شهري</button>
      <button id="btn-yearly" onclick="setCycle('yearly')">سنوي <span class="save-tag">وفّر 17٪</span></button>
    </div>
  </div>
</section>

<div class="plans" id="plans-monthly">${plans.map((p) => planCard(p, 'monthly')).join('')}</div>
<div class="plans" id="plans-yearly" style="display:none">${plans.map((p) => planCard(p, 'yearly')).join('')}</div>

<section class="faq">
  <h2>أسئله شائعه</h2>
  <div class="q"><h3>هل ينفع أبتدي مجاني؟</h3><p>أيوه! كل حساب جديد بياخد 30 يوم كامله من الباقه الأساسيه بلاش، بدون كارت ائتمان. بعد كده تختار الباقه المناسبه.</p></div>
  <div class="q"><h3>لو خلص الاشتراك، ايه الي بيحصل؟</h3><p>بياناتك ومنتجاتك بيفضلوا محفوظين، بس صفحه متجرك بتقفل مؤقتًا لحد ما تجدد. تقدر تدخل داشبورد التاجر عادي.</p></div>
  <div class="q"><h3>إزاي بدفع؟</h3><p>حاليًا بنستقبل الاشتراكات عن طريق واتساب — بتدوس على "اشترك"، بتوصلنا رساله، وبنرد عليك بطرق الدفع المتاحه (تحويل بنكي، فوري، فودافون كاش). قريبًا هيبقى في دفع أونلاين مباشر.</p></div>
  <div class="q"><h3>ينفع أغيّر الباقه؟</h3><p>أكيد. في أي وقت تقدر تترقى من الأساسي للبرو أو تنزل. الفرق في السعر بيتحسبلك بالنسبه.</p></div>
  <div class="q"><h3>ينفع ألغي؟</h3><p>أيوه في أي وقت من داشبورد الاشتراك، من غير رسوم إلغاء. اشتراكك بيفضل شغال لحد ما ينتهي.</p></div>
</section>

<div class="cta-strip">
  <h2>لسه مش متأكد؟</h2>
  <p>جرب متجري 30 يوم مجانًا — بدون كارت ائتمان، بدون التزام.</p>
  <a href="/register">🚀 ابدأ متجرك دلوقتي</a>
</div>

<footer>
  <a href="/">الرئيسيه</a>·<a href="/terms">شروط الاستخدام</a>·<a href="/privacy">سياسه الخصوصيه</a>·<a href="https://wa.me/${SUPPORT_WHATSAPP}" target="_blank">واتساب</a>
</footer>

<script>
function setCycle(c){
  document.getElementById('plans-monthly').style.display = c === 'monthly' ? 'grid' : 'none';
  document.getElementById('plans-yearly').style.display  = c === 'yearly'  ? 'grid' : 'none';
  document.getElementById('btn-monthly').classList.toggle('active', c === 'monthly');
  document.getElementById('btn-yearly').classList.toggle('active', c === 'yearly');
}
</script>
</body></html>`;
}

module.exports = { renderPricingPage };
