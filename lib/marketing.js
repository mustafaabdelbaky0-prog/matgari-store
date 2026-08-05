// marketing.js — public landing page shown at `/` for logged-out visitors.
// Explains what متجري is and pushes to /register.

const { esc } = require('./view');

function renderMarketing(host) {
  const registerUrl = '/register';
  const loginUrl = '/login';
  const demoStore = 'https://matgari-store.vercel.app/store/متجر-تجريبي-أطفال';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>متجري — ابدأ متجرك الإلكتروني في دقايق</title>
<meta name="description" content="منصه متجري: افتح متجر أونلاين احترافي بمجالك، رابط جاهز تبعته لعملائك، إداره مخزون بالمقاسات، طلبات على واتساب، ومساعد ذكاء اصطناعي. مجاني للبدايه.">
<meta property="og:type" content="website">
<meta property="og:title" content="متجري — ابدأ متجرك الإلكتروني في دقايق">
<meta property="og:description" content="منصه متجري: افتح متجر أونلاين احترافي بمجالك، رابط جاهز تبعته لعملائك، وطلبات على واتساب.">
<meta property="og:image" content="${host ? `https://${host}/icons/icon-512.png` : '/icons/icon-512.png'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="icon" href="/icons/icon-192.png">
<style>
  :root {
    --ink: #0F172A;
    --ink-2: #475569;
    --ink-3: #94A3B8;
    --bg: #FFFFFF;
    --bg-soft: #F8FAFC;
    --line: #E2E8F0;
    --brand: #4F46E5;
    --brand-2: #7C3AED;
    --accent: #EC4899;
    --success: #10B981;
    --amber: #F59E0B;
    --card: #FFFFFF;
    --shadow-sm: 0 2px 6px rgba(15,23,42,.06);
    --shadow-md: 0 8px 24px rgba(15,23,42,.08);
    --shadow-lg: 0 20px 40px rgba(79,70,229,.15);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Cairo', sans-serif;
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }

  /* Navigation */
  .nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255,255,255,.85);
    backdrop-filter: saturate(1.4) blur(12px);
    border-bottom: 1px solid var(--line);
  }
  .nav-inner {
    max-width: 1180px; margin: 0 auto;
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
  }
  .brand {
    display: flex; align-items: center; gap: 10px;
    font-weight: 800; font-size: 20px; color: var(--brand);
  }
  .brand-mark {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, var(--brand), var(--brand-2));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 20px;
    box-shadow: 0 4px 12px rgba(79,70,229,.28);
  }
  .nav-links { display: flex; align-items: center; gap: 8px; }
  .nav-links a {
    padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--ink-2);
    transition: color .15s, background .15s;
  }
  .nav-links a:hover { color: var(--brand); background: var(--bg-soft); }
  .nav-links .cta {
    background: var(--brand); color: #fff;
  }
  .nav-links .cta:hover { background: var(--brand-2); color: #fff; }

  /* Hero */
  .hero {
    padding: 80px 24px 60px;
    max-width: 1180px; margin: 0 auto;
    display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, rgba(79,70,229,.08), rgba(236,72,153,.08));
    border: 1px solid rgba(79,70,229,.15);
    padding: 6px 14px; border-radius: 999px;
    font-size: 13px; font-weight: 600; color: var(--brand);
    margin-bottom: 22px;
  }
  .hero-badge::before {
    content: ''; width: 8px; height: 8px; border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 4px rgba(16,185,129,.15);
  }
  .hero h1 {
    font-size: 48px; font-weight: 900;
    line-height: 1.15; letter-spacing: -0.02em;
    margin: 0 0 20px;
    color: var(--ink);
  }
  .hero h1 .accent {
    background: linear-gradient(135deg, var(--brand), var(--accent));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .hero p.lede {
    font-size: 18px; line-height: 1.7; color: var(--ink-2);
    margin: 0 0 32px; max-width: 540px;
  }
  .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 26px; }
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 26px; border-radius: 12px;
    font-family: inherit; font-size: 15.5px; font-weight: 700;
    cursor: pointer; border: none;
    transition: transform .15s, box-shadow .15s, background .15s;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--brand), var(--brand-2));
    color: #fff; box-shadow: var(--shadow-lg);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 24px 48px rgba(79,70,229,.25); }
  .btn-outline {
    background: #fff; color: var(--ink); border: 1.5px solid var(--line);
  }
  .btn-outline:hover { border-color: var(--brand); color: var(--brand); }
  .hero-trust {
    display: flex; align-items: center; gap: 20px; font-size: 13px; color: var(--ink-3);
  }
  .hero-trust .dot { color: var(--success); }

  /* Hero visual — mock phone frame */
  .hero-visual {
    position: relative;
    display: flex; justify-content: center; align-items: center;
    min-height: 480px;
  }
  .phone {
    width: 300px; height: 600px;
    background: #0F172A;
    border-radius: 42px;
    padding: 12px;
    box-shadow: 0 32px 64px rgba(15,23,42,.25), 0 0 0 8px rgba(15,23,42,.05);
    position: relative;
    transform: rotate(-4deg);
  }
  .phone::before {
    content: ''; position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    width: 100px; height: 22px; background: #000; border-radius: 999px;
  }
  .phone-screen {
    width: 100%; height: 100%;
    background: linear-gradient(180deg, #FBF3EC, #F5CBD6 40%, #FBF3EC);
    border-radius: 32px;
    overflow: hidden; padding: 40px 16px 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .phone-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; background: #fff; border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,.05);
  }
  .phone-header .logo {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; color: #B84A64;
  }
  .phone-header .logo .icon { font-size: 18px; }
  .phone-header .cart {
    background: #B84A64; color: #fff; padding: 5px 10px; border-radius: 12px;
    font-size: 10px; font-weight: 700;
  }
  .phone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
  .phone-product {
    background: #fff; border-radius: 10px; padding: 8px;
    display: flex; flex-direction: column; gap: 5px;
  }
  .phone-product .img {
    aspect-ratio: 1; background: linear-gradient(135deg, #F5CBD6, #D9647E);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: #fff;
  }
  .phone-product .name { font-size: 9px; font-weight: 700; color: #3C2E2E; line-height: 1.3; }
  .phone-product .price { font-size: 10px; font-weight: 800; color: #B84A64; }
  .phone-badge {
    position: absolute; padding: 8px 12px; border-radius: 10px;
    background: #fff; box-shadow: var(--shadow-md);
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700;
  }
  .phone-badge.top {
    top: 60px; right: -20px; color: var(--success);
    animation: float 3s ease-in-out infinite;
  }
  .phone-badge.bottom {
    bottom: 100px; left: -30px; color: var(--brand);
    animation: float 3s ease-in-out infinite .8s;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* Stats bar */
  .stats {
    background: var(--bg-soft);
    padding: 40px 24px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .stats-inner {
    max-width: 1180px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px;
  }
  .stat { text-align: center; }
  .stat .num {
    font-size: 34px; font-weight: 900;
    background: linear-gradient(135deg, var(--brand), var(--accent));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    line-height: 1;
  }
  .stat .label { font-size: 13px; color: var(--ink-2); margin-top: 6px; font-weight: 600; }

  /* Section */
  section.block {
    padding: 90px 24px;
    max-width: 1180px; margin: 0 auto;
  }
  .section-tag {
    display: inline-block;
    font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--brand);
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 36px; font-weight: 800;
    line-height: 1.2; letter-spacing: -0.015em;
    color: var(--ink); margin: 0 0 16px;
    max-width: 24ch;
  }
  .section-sub {
    font-size: 17px; color: var(--ink-2); line-height: 1.7;
    max-width: 60ch; margin: 0 0 40px;
  }

  /* Features */
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .feature {
    background: #fff; border: 1px solid var(--line);
    border-radius: 16px; padding: 28px;
    transition: transform .18s, box-shadow .18s, border-color .18s;
  }
  .feature:hover {
    transform: translateY(-4px); box-shadow: var(--shadow-md);
    border-color: transparent;
  }
  .feature .icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 16px;
  }
  .feature .icon.purple { background: linear-gradient(135deg, #EEF2FF, #E0E7FF); }
  .feature .icon.pink { background: linear-gradient(135deg, #FCE7F3, #FBCFE8); }
  .feature .icon.green { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); }
  .feature .icon.amber { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }
  .feature .icon.blue { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
  .feature .icon.rose { background: linear-gradient(135deg, #FFE4E6, #FECACA); }
  .feature h3 { font-size: 18px; font-weight: 800; margin: 0 0 8px; color: var(--ink); }
  .feature p { font-size: 14.5px; color: var(--ink-2); line-height: 1.65; margin: 0; }

  /* Categories */
  .categories {
    background: linear-gradient(180deg, var(--bg), var(--bg-soft));
  }
  .cat-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  }
  .cat {
    background: #fff; border: 1px solid var(--line);
    border-radius: 14px; padding: 22px 18px;
    text-align: center;
    transition: transform .18s, box-shadow .18s;
  }
  .cat:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .cat .emoji { font-size: 32px; margin-bottom: 10px; display: block; }
  .cat .name { font-size: 14px; font-weight: 700; color: var(--ink); }
  .cat .desc { font-size: 12px; color: var(--ink-2); margin-top: 4px; }

  /* Steps */
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 30px; }
  .step {
    position: relative; padding: 30px 24px;
    background: #fff; border: 1px solid var(--line); border-radius: 16px;
  }
  .step .n {
    position: absolute; top: -18px; right: 20px;
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, var(--brand), var(--brand-2));
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; font-family: 'Cairo', sans-serif;
    box-shadow: 0 6px 16px rgba(79,70,229,.28);
  }
  .step h4 { font-size: 17px; font-weight: 800; margin: 12px 0 8px; color: var(--ink); }
  .step p { font-size: 14.5px; color: var(--ink-2); line-height: 1.65; margin: 0; }

  /* Final CTA */
  .final-cta {
    background: linear-gradient(135deg, var(--brand), var(--brand-2));
    color: #fff;
    padding: 80px 24px;
    text-align: center;
    position: relative; overflow: hidden;
  }
  .final-cta::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 20% 20%, rgba(236,72,153,.3), transparent 40%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,.15), transparent 40%);
    pointer-events: none;
  }
  .final-cta > * { position: relative; z-index: 1; }
  .final-cta h2 {
    font-size: 42px; font-weight: 900; margin: 0 0 16px;
    letter-spacing: -0.02em;
  }
  .final-cta p {
    font-size: 18px; opacity: .92; max-width: 560px; margin: 0 auto 32px; line-height: 1.7;
  }
  .final-cta .btn-white {
    background: #fff; color: var(--brand);
    box-shadow: 0 20px 40px rgba(0,0,0,.2);
  }
  .final-cta .btn-white:hover { transform: translateY(-2px); box-shadow: 0 24px 48px rgba(0,0,0,.28); }

  /* Footer */
  footer {
    background: #0F172A; color: #94A3B8;
    padding: 40px 24px;
    text-align: center; font-size: 13.5px;
  }
  footer .brand-mark { display: inline-flex; margin-bottom: 12px; }
  footer .brand-mark .m { color: #fff; font-weight: 800; margin-inline-start: 8px; }
  footer .links { display: flex; justify-content: center; gap: 20px; margin: 14px 0; font-size: 13px; }
  footer .links a:hover { color: #fff; }

  /* Responsive */
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; padding: 50px 20px 30px; gap: 40px; }
    .hero h1 { font-size: 36px; }
    .hero-visual { min-height: 400px; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .features { grid-template-columns: 1fr; }
    .cat-grid { grid-template-columns: repeat(2, 1fr); }
    .steps { grid-template-columns: 1fr; }
    .section-title { font-size: 28px; }
    .final-cta h2 { font-size: 30px; }
    .nav-links a:not(.cta) { display: none; }
  }
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="brand">
      <span class="brand-mark">🛍️</span>
      متجري
    </a>
    <div class="nav-links">
      <a href="#features">الفيتشرز</a>
      <a href="#categories">المجالات</a>
      <a href="#how">إزاي تبدأ</a>
      <a href="${loginUrl}">دخول</a>
      <a href="${registerUrl}" class="cta">ابدأ مجانًا</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div>
    <span class="hero-badge">مجاني للبدايه · بدون كارت ائتمان</span>
    <h1>افتح متجرك الأونلاين في <span class="accent">دقايق</span>، مش شهور</h1>
    <p class="lede">
      متجري بيدّيك كل حاجه محتاجها تدير بيزنسك: صفحه بيع احترافيه بتصميم مخصوص لمجالك، إداره مخزون بالمقاسات، طلبات تيجي على واتساب، ومساعد ذكاء اصطناعي بيساعدك في أي مشكله.
    </p>
    <div class="hero-cta">
      <a href="${registerUrl}" class="btn btn-primary">🚀 ابدأ متجرك دلوقتي</a>
      <a href="${demoStore}" target="_blank" class="btn btn-outline">👀 شوف متجر تجريبي</a>
    </div>
    <div class="hero-trust">
      <span><span class="dot">✓</span> بدون كارت</span>
      <span><span class="dot">✓</span> بدون رسوم شهريه</span>
      <span><span class="dot">✓</span> عربي بالكامل</span>
    </div>
  </div>

  <div class="hero-visual">
    <div class="phone-badge top">🛒 طلب جديد</div>
    <div class="phone-badge bottom">💬 دعم ذكي</div>
    <div class="phone">
      <div class="phone-screen">
        <div class="phone-header">
          <div class="logo"><span class="icon">🎀</span>متجرك</div>
          <div class="cart">🛍️ 3</div>
        </div>
        <div class="phone-grid">
          <div class="phone-product">
            <div class="img">👕</div>
            <div class="name">تيشرت أطفال</div>
            <div class="price">300 ج.م</div>
          </div>
          <div class="phone-product">
            <div class="img">👗</div>
            <div class="name">فستان بناتي</div>
            <div class="price">450 ج.م</div>
          </div>
          <div class="phone-product">
            <div class="img">👶</div>
            <div class="name">طقم مواليد</div>
            <div class="price">280 ج.م</div>
          </div>
          <div class="phone-product">
            <div class="img">🧸</div>
            <div class="name">لعبه أطفال</div>
            <div class="price">150 ج.م</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="stats">
  <div class="stats-inner">
    <div class="stat">
      <div class="num">8+</div>
      <div class="label">مجالات مدعومه</div>
    </div>
    <div class="stat">
      <div class="num">100%</div>
      <div class="label">مجاني للبدايه</div>
    </div>
    <div class="stat">
      <div class="num">5 دقايق</div>
      <div class="label">لفتح متجرك</div>
    </div>
    <div class="stat">
      <div class="num">24/7</div>
      <div class="label">دعم ذكي</div>
    </div>
  </div>
</section>

<section class="block" id="features">
  <span class="section-tag">الفيتشرز</span>
  <h2 class="section-title">كل حاجه محتاجها لإداره متجرك في مكان واحد</h2>
  <p class="section-sub">من إضافه المنتج لحد وصول الطلب لعميلك — كله من واجهه عربيه بسيطه.</p>
  <div class="features">
    <div class="feature">
      <div class="icon purple">🎨</div>
      <h3>تصميم مخصوص لمجالك</h3>
      <p>ملابس أطفال بتصميم مختلف عن العطور مختلف عن الأحذيه. كل مجال بألوانه وفلاتره الخاصه.</p>
    </div>
    <div class="feature">
      <div class="icon pink">📦</div>
      <h3>مخزون ذكي بالمقاسات</h3>
      <p>لما مقاس معين يخلص، بيختفي أوتوماتيك من صفحه البيع. لا حرج مع العميل تاني.</p>
    </div>
    <div class="feature">
      <div class="icon green">💬</div>
      <h3>الطلبات على واتساب</h3>
      <p>العميل بيدوس اطلب، بيتفتحله واتسابك برساله جاهزه فيها كل تفاصيل الطلب والعنوان.</p>
    </div>
    <div class="feature">
      <div class="icon amber">🧾</div>
      <h3>فواتير مشتريات ومبيعات</h3>
      <p>سجّل كل عمليات الشراء والبيع، وشوف رصيد الخزنه ومكسبك في أي وقت.</p>
    </div>
    <div class="feature">
      <div class="icon blue">🏷️</div>
      <h3>أقسام مخصوصه</h3>
      <p>اعمل أقسام زي "عروض الصيف" أو "وصل حديثًا"، وحط منتجاتك فيهم. الفلاتر بتظهر أوتوماتيك على صفحه البيع.</p>
    </div>
    <div class="feature">
      <div class="icon rose">🤖</div>
      <h3>مساعد ذكاء اصطناعي</h3>
      <p>لو استخدمت التطبيق ولاقيت مشكله أو مش فاهم حاجه، فيه مساعد فاهم كل حاجه عن التطبيق وبيرد عليك فورًا.</p>
    </div>
  </div>
</section>

<section class="block categories" id="categories">
  <span class="section-tag">المجالات المدعومه</span>
  <h2 class="section-title">أي كان بتبيع إيه، عندنا تصميم يناسبك</h2>
  <p class="section-sub">كل مجال بيجيله تصميم صفحه بيع مخصوص، وأتربيوتس (زي المقاسات والألوان) بتناسب طبيعه منتجاته.</p>
  <div class="cat-grid">
    <div class="cat"><span class="emoji">🧒</span><div class="name">ملابس أطفال</div><div class="desc">مقاسات، ألوان، أطقم</div></div>
    <div class="cat"><span class="emoji">🧴</span><div class="name">عطور</div><div class="desc">أحجام مل، رجالي/حريمي</div></div>
    <div class="cat"><span class="emoji">👟</span><div class="name">أحذية</div><div class="desc">مقاسات، خامات، طرازات</div></div>
    <div class="cat"><span class="emoji">📱</span><div class="name">إكسسوارات موبايل</div><div class="desc">توافق مع الأجهزه</div></div>
    <div class="cat"><span class="emoji">👔</span><div class="name">ملابس شبابي</div><div class="desc">S, M, L, XL — كاجوال ورسمي</div></div>
    <div class="cat"><span class="emoji">💍</span><div class="name">إكسسوارات حريمي</div><div class="desc">خواتم، حلق، ساعات</div></div>
    <div class="cat"><span class="emoji">🏠</span><div class="name">أدوات منزلية</div><div class="desc">مطبخ، ديكور، تنظيم</div></div>
    <div class="cat"><span class="emoji">📦</span><div class="name">مواد تعبئه وتغليف</div><div class="desc">كرتون، أكياس، ملصقات</div></div>
  </div>
</section>

<section class="block" id="how">
  <span class="section-tag">إزاي تبدأ</span>
  <h2 class="section-title">3 خطوات بس، ومتجرك أونلاين</h2>
  <div class="steps">
    <div class="step">
      <div class="n">1</div>
      <h4>سجّل واختار مجالك</h4>
      <p>سجّل حساب بإيميلك، اختار المجال (ملابس أطفال، عطور، إلخ)، وحط رقم واتسابك.</p>
    </div>
    <div class="step">
      <div class="n">2</div>
      <h4>ضيف منتجاتك</h4>
      <p>ارفع صور المنتج، اكتب الاسم والسعر، وحدد المقاسات المتاحه. المنتجات هتظهر فورًا على صفحه بيعك.</p>
    </div>
    <div class="step">
      <div class="n">3</div>
      <h4>شارك اللينك واستقبل الطلبات</h4>
      <p>هتاخد لينك مباشر (زي <code>matgari-store.vercel.app/store/متجرك</code>) شاركه على السوشيال ميديا، والطلبات هتوصلك على واتساب.</p>
    </div>
  </div>
</section>

<section class="final-cta">
  <h2>جاهز تبدأ؟</h2>
  <p>افتح متجرك دلوقتي مجانًا — ماتحتاجش كارت ائتمان ولا رسوم شهريه، وابدأ تستقبل طلبات عملائك في نفس اليوم.</p>
  <a href="${registerUrl}" class="btn btn-white">🚀 ابدأ متجرك دلوقتي — مجانًا</a>
</section>

<footer>
  <div>
    <span class="brand-mark">🛍️</span>
    <span class="m">متجري</span>
  </div>
  <div class="links">
    <a href="${loginUrl}">تسجيل الدخول</a>
    <span>·</span>
    <a href="${registerUrl}">إنشاء حساب</a>
  </div>
  <div>صنع بحب لأصحاب المشاريع الصغيره 💜</div>
</footer>

</body>
</html>`;
}

module.exports = { renderMarketing };
