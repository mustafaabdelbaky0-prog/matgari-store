// marketing.js — public landing page shown at `/` for logged-out visitors.
// Every feature card is clickable and opens a modal explaining the feature
// with previews. Support-WhatsApp and AI-chat buttons wired to real handlers.

const { esc } = require('./view');

// Support WhatsApp number the "Ask us on WhatsApp" button opens.
// Egyptian intl format (no + prefix, no leading 0). Change here to update
// everywhere on the marketing page.
const SUPPORT_WHATSAPP = '201040773728';

function renderMarketing(host) {
  const registerUrl = '/register';
  const loginUrl = '/login';
  const demoUrl = '/demo';
  const waLink = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('السلام عليكم، عندي سؤال عن تطبيق متجري')}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>متجري — ابدأ متجرك الإلكتروني في دقايق</title>
<meta name="description" content="منصه متجري: افتح متجر أونلاين احترافي بمجالك، رابط جاهز تبعته لعملائك، إداره مخزون بالمقاسات، طلبات على واتساب، ومساعد ذكاء اصطناعي. مجاني للبدايه.">
<meta property="og:type" content="website">
<meta property="og:title" content="متجري — ابدأ متجرك الإلكتروني في دقايق">
<meta property="og:description" content="افتح متجر أونلاين احترافي بمجالك، وطلبات على واتساب.">
<meta property="og:image" content="${host ? `https://${host}/icons/icon-512.png` : '/icons/icon-512.png'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="icon" href="/icons/icon-192.png">
<style>
  :root {
    --ink: #0F172A; --ink-2: #475569; --ink-3: #94A3B8;
    --bg: #FFFFFF; --bg-soft: #F8FAFC;
    --line: #E2E8F0;
    --brand: #4F46E5; --brand-2: #7C3AED; --accent: #EC4899;
    --success: #10B981; --amber: #F59E0B; --whatsapp: #25D366;
    --card: #FFFFFF;
    --shadow-sm: 0 2px 6px rgba(15,23,42,.06);
    --shadow-md: 0 8px 24px rgba(15,23,42,.08);
    --shadow-lg: 0 20px 40px rgba(79,70,229,.15);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: 'Cairo', sans-serif; font-size: 16px; line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }

  /* Nav */
  .nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.85); backdrop-filter: saturate(1.4) blur(12px); border-bottom: 1px solid var(--line); }
  .nav-inner { max-width: 1180px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 20px; color: var(--brand); }
  .brand-mark { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, var(--brand), var(--brand-2)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; box-shadow: 0 4px 12px rgba(79,70,229,.28); }
  .nav-links { display: flex; align-items: center; gap: 8px; }
  .nav-links a, .nav-links button { padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--ink-2); background: transparent; border: none; cursor: pointer; transition: color .15s, background .15s; }
  .nav-links a:hover, .nav-links button:hover { color: var(--brand); background: var(--bg-soft); }
  .nav-links .cta { background: var(--brand); color: #fff; }
  .nav-links .cta:hover { background: var(--brand-2); color: #fff; }

  /* Hero */
  .hero { padding: 80px 24px 60px; max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 60px; align-items: center; }
  .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(79,70,229,.08), rgba(236,72,153,.08)); border: 1px solid rgba(79,70,229,.15); padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--brand); margin-bottom: 22px; }
  .hero-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px rgba(16,185,129,.15); }
  .hero h1 { font-size: 48px; font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 20px; color: var(--ink); }
  .hero h1 .accent { background: linear-gradient(135deg, var(--brand), var(--accent)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .hero p.lede { font-size: 18px; line-height: 1.7; color: var(--ink-2); margin: 0 0 32px; max-width: 540px; }
  .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 26px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; border-radius: 12px; font-family: inherit; font-size: 15.5px; font-weight: 700; cursor: pointer; border: none; transition: transform .15s, box-shadow .15s, background .15s; text-decoration: none; }
  .btn-primary { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; box-shadow: var(--shadow-lg); }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 24px 48px rgba(79,70,229,.25); }
  .btn-outline { background: #fff; color: var(--ink); border: 1.5px solid var(--line); }
  .btn-outline:hover { border-color: var(--brand); color: var(--brand); }
  .btn-whatsapp { background: var(--whatsapp); color: #fff; }
  .btn-whatsapp:hover { background: #1FAF54; transform: translateY(-2px); }
  .hero-trust { display: flex; align-items: center; gap: 20px; font-size: 13px; color: var(--ink-3); flex-wrap: wrap; }
  .hero-trust .dot { color: var(--success); }

  /* Phone mockup */
  .hero-visual { position: relative; display: flex; justify-content: center; align-items: center; min-height: 480px; }
  .phone { width: 300px; height: 600px; background: #0F172A; border-radius: 42px; padding: 12px; box-shadow: 0 32px 64px rgba(15,23,42,.25), 0 0 0 8px rgba(15,23,42,.05); position: relative; transform: rotate(-4deg); }
  .phone::before { content: ''; position: absolute; top: 22px; left: 50%; transform: translateX(-50%); width: 100px; height: 22px; background: #000; border-radius: 999px; z-index: 2; }
  .phone-screen { width: 100%; height: 100%; background: linear-gradient(180deg, #FBF3EC, #F5CBD6 40%, #FBF3EC); border-radius: 32px; overflow: hidden; padding: 44px 14px 20px; display: flex; flex-direction: column; gap: 10px; }
  .phone-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #fff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.05); }
  .phone-header .logo { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #B84A64; }
  .phone-header .cart { background: #B84A64; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; }
  .phone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .phone-product { background: #fff; border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 5px; }
  .phone-product .img { aspect-ratio: 1; background: linear-gradient(135deg, #F5CBD6, #D9647E); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff; }
  .phone-product .name { font-size: 9.5px; font-weight: 700; color: #3C2E2E; line-height: 1.3; }
  .phone-product .price { font-size: 10px; font-weight: 800; color: #B84A64; }
  .phone-badge { position: absolute; padding: 8px 12px; border-radius: 10px; background: #fff; box-shadow: var(--shadow-md); display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
  .phone-badge.top { top: 60px; right: -20px; color: var(--success); animation: float 3s ease-in-out infinite; }
  .phone-badge.bottom { bottom: 100px; left: -30px; color: var(--brand); animation: float 3s ease-in-out infinite .8s; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  /* Stats */
  .stats { background: var(--bg-soft); padding: 40px 24px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .stats-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
  .stat { text-align: center; }
  .stat .num { font-size: 34px; font-weight: 900; background: linear-gradient(135deg, var(--brand), var(--accent)); -webkit-background-clip: text; background-clip: text; color: transparent; line-height: 1; }
  .stat .label { font-size: 13px; color: var(--ink-2); margin-top: 6px; font-weight: 600; }

  /* Section */
  section.block { padding: 90px 24px; max-width: 1180px; margin: 0 auto; }
  .section-tag { display: inline-block; font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--brand); margin-bottom: 14px; }
  .section-title { font-size: 36px; font-weight: 800; line-height: 1.2; letter-spacing: -0.015em; color: var(--ink); margin: 0 0 16px; max-width: 24ch; }
  .section-sub { font-size: 17px; color: var(--ink-2); line-height: 1.7; max-width: 60ch; margin: 0 0 40px; }

  /* Features */
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .feature { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 28px; cursor: pointer; transition: transform .18s, box-shadow .18s, border-color .18s; position: relative; text-align: right; font-family: inherit; }
  .feature:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: transparent; }
  .feature .icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
  .feature .icon.purple { background: linear-gradient(135deg, #EEF2FF, #E0E7FF); }
  .feature .icon.pink { background: linear-gradient(135deg, #FCE7F3, #FBCFE8); }
  .feature .icon.green { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); }
  .feature .icon.amber { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }
  .feature .icon.blue { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
  .feature .icon.rose { background: linear-gradient(135deg, #FFE4E6, #FECACA); }
  .feature h3 { font-size: 18px; font-weight: 800; margin: 0 0 8px; color: var(--ink); }
  .feature p { font-size: 14.5px; color: var(--ink-2); line-height: 1.65; margin: 0; }
  .feature .more { display: flex; align-items: center; gap: 6px; margin-top: 14px; color: var(--brand); font-weight: 700; font-size: 13.5px; }
  .feature .more .arrow { transition: transform .15s; }
  .feature:hover .more .arrow { transform: translateX(-4px); }

  /* Categories */
  .categories { background: linear-gradient(180deg, var(--bg), var(--bg-soft)); }
  .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .cat { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 22px 18px; text-align: center; transition: transform .18s, box-shadow .18s; }
  .cat:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .cat .emoji { font-size: 32px; margin-bottom: 10px; display: block; }
  .cat .name { font-size: 14px; font-weight: 700; color: var(--ink); }
  .cat .desc { font-size: 12px; color: var(--ink-2); margin-top: 4px; }

  /* Steps */
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 30px; }
  .step { position: relative; padding: 30px 24px; background: #fff; border: 1px solid var(--line); border-radius: 16px; }
  .step .n { position: absolute; top: -18px; right: 20px; width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; box-shadow: 0 6px 16px rgba(79,70,229,.28); }
  .step h4 { font-size: 17px; font-weight: 800; margin: 12px 0 8px; color: var(--ink); }
  .step p { font-size: 14.5px; color: var(--ink-2); line-height: 1.65; margin: 0; }

  /* Final CTA */
  .final-cta { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; padding: 80px 24px; text-align: center; position: relative; overflow: hidden; }
  .final-cta::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 20%, rgba(236,72,153,.3), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.15), transparent 40%); pointer-events: none; }
  .final-cta > * { position: relative; z-index: 1; }
  .final-cta h2 { font-size: 42px; font-weight: 900; margin: 0 0 16px; letter-spacing: -0.02em; }
  .final-cta p { font-size: 18px; opacity: .92; max-width: 560px; margin: 0 auto 32px; line-height: 1.7; }
  .final-cta .btn-white { background: #fff; color: var(--brand); box-shadow: 0 20px 40px rgba(0,0,0,.2); }
  .final-cta .btn-white:hover { transform: translateY(-2px); box-shadow: 0 24px 48px rgba(0,0,0,.28); }

  /* Footer */
  footer { background: #0F172A; color: #94A3B8; padding: 40px 24px; text-align: center; font-size: 13.5px; }
  footer .brand-mark { display: inline-flex; margin-bottom: 12px; }
  footer .brand-mark .m { color: #fff; font-weight: 800; margin-inline-start: 8px; }
  footer .links { display: flex; justify-content: center; gap: 20px; margin: 14px 0; font-size: 13px; flex-wrap: wrap; }
  footer .links a:hover { color: #fff; }

  /* MODAL */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(4px); z-index: 100; display: none; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; animation: fadeIn .18s ease-out; }
  .modal-backdrop.open { display: flex; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal { background: #fff; border-radius: 22px; max-width: 620px; width: 100%; max-height: 88vh; overflow-y: auto; box-shadow: 0 40px 80px rgba(0,0,0,.35); animation: pop .22s cubic-bezier(.34,1.56,.64,1); }
  @keyframes pop { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
  .modal-head { padding: 24px 28px 16px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 14px; }
  .modal-head .icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .modal-head h3 { margin: 0; font-size: 20px; font-weight: 800; color: var(--ink); flex: 1; }
  .modal-head .x { background: transparent; border: none; color: var(--ink-3); font-size: 22px; cursor: pointer; padding: 4px 10px; border-radius: 8px; }
  .modal-head .x:hover { background: var(--bg-soft); color: var(--ink); }
  .modal-body { padding: 20px 28px 28px; }
  .modal-body p { color: var(--ink-2); line-height: 1.75; margin: 0 0 14px; font-size: 15px; }
  .modal-body h4 { font-size: 15px; margin: 20px 0 10px; color: var(--ink); font-weight: 700; }
  .modal-body ul { padding-inline-start: 20px; margin: 0 0 14px; color: var(--ink-2); }
  .modal-body ul li { margin-bottom: 6px; line-height: 1.7; }

  /* Design theme previews inside modal */
  .theme-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
  .theme-card { border: 1.5px solid var(--line); border-radius: 12px; overflow: hidden; }
  .theme-card .preview { height: 80px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; }
  .theme-card .caption { padding: 8px 12px; font-size: 12.5px; }
  .theme-card .caption b { color: var(--ink); }
  .theme-card .caption span { color: var(--ink-3); display: block; font-size: 11px; margin-top: 2px; }
  .default-note { background: linear-gradient(135deg, #EEF2FF, #FCE7F3); padding: 12px 16px; border-radius: 10px; font-size: 13px; color: var(--ink); border-inline-start: 3px solid var(--brand); margin: 14px 0; }
  .default-note b { color: var(--brand); }

  /* Forms inside modals */
  .modal-form { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .modal-form label { font-size: 13px; font-weight: 600; color: var(--ink); }
  .modal-form input, .modal-form textarea { border: 1.5px solid var(--line); border-radius: 10px; padding: 10px 14px; font-family: inherit; font-size: 14px; background: #fff; color: var(--ink); }
  .modal-form input:focus, .modal-form textarea:focus { outline: none; border-color: var(--brand); }
  .modal-form textarea { min-height: 88px; resize: vertical; }
  .modal-form button { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: #fff; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 14.5px; cursor: pointer; }
  .modal-form button:hover { opacity: .95; }
  .modal-form button:disabled { opacity: .55; cursor: not-allowed; }
  .form-ok { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; padding: 10px 14px; border-radius: 10px; font-size: 13.5px; margin-top: 10px; }
  .form-err { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; padding: 10px 14px; border-radius: 10px; font-size: 13.5px; margin-top: 10px; }

  /* AI chat inside modal */
  .aic { display: flex; flex-direction: column; gap: 10px; }
  .aic-body { min-height: 240px; max-height: 340px; overflow-y: auto; padding: 8px; background: var(--bg-soft); border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
  .aic-msg { max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word; }
  .aic-msg.user { align-self: flex-end; background: var(--brand); color: #fff; border-bottom-right-radius: 4px; }
  .aic-msg.bot { align-self: flex-start; background: #fff; color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 4px; }
  .aic-typing { align-self: flex-start; color: var(--ink-3); font-size: 12.5px; font-style: italic; padding: 4px 8px; }
  .aic-input { display: flex; gap: 8px; }
  .aic-input input { flex: 1; border: 1.5px solid var(--line); border-radius: 20px; padding: 10px 16px; font-family: inherit; font-size: 14px; outline: none; background: #fff; color: var(--ink); }
  .aic-input input:focus { border-color: var(--brand); }
  .aic-input button { background: var(--brand); color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .aic-input button:disabled { opacity: .5; cursor: not-allowed; }

  /* WhatsApp modal — big green CTA */
  .wa-hero { text-align: center; padding: 20px 0; }
  .wa-hero .num { font-size: 22px; font-weight: 800; color: var(--whatsapp); direction: ltr; font-family: monospace; margin: 10px 0 20px; }

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
    .nav-links a:not(.cta), .nav-links button { display: none; }
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
      <button onclick="openModal('wa')">تواصل</button>
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
      <a href="${demoUrl}" class="btn btn-outline">👀 شوف متجر تجريبي</a>
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
          <div class="logo"><span>🎀</span>متجرك</div>
          <div class="cart">🛍️ 3</div>
        </div>
        <div class="phone-grid">
          <div class="phone-product"><div class="img">👕</div><div class="name">تيشرت أطفال</div><div class="price">300 ج.م</div></div>
          <div class="phone-product"><div class="img">👗</div><div class="name">فستان بناتي</div><div class="price">450 ج.م</div></div>
          <div class="phone-product"><div class="img">👶</div><div class="name">طقم مواليد</div><div class="price">280 ج.م</div></div>
          <div class="phone-product"><div class="img">🧸</div><div class="name">لعبه أطفال</div><div class="price">150 ج.م</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="stats">
  <div class="stats-inner">
    <div class="stat"><div class="num">8+</div><div class="label">مجالات مدعومه</div></div>
    <div class="stat"><div class="num">100%</div><div class="label">مجاني للبدايه</div></div>
    <div class="stat"><div class="num">5 دقايق</div><div class="label">لفتح متجرك</div></div>
    <div class="stat"><div class="num">24/7</div><div class="label">دعم ذكي</div></div>
  </div>
</section>

<section class="block" id="features">
  <span class="section-tag">الفيتشرز</span>
  <h2 class="section-title">كل حاجه محتاجها لإداره متجرك في مكان واحد</h2>
  <p class="section-sub">دوس على أي فيتشر تعرف تفاصيله وتشوف شكله.</p>
  <div class="features">
    <button class="feature" onclick="openModal('design')">
      <div class="icon purple">🎨</div>
      <h3>تصميم مخصوص لمجالك</h3>
      <p>ملابس أطفال بتصميم مختلف عن العطور مختلف عن الأحذيه. كل مجال بألوانه وفلاتره الخاصه.</p>
      <div class="more">شوف التصميمات <span class="arrow">←</span></div>
    </button>
    <button class="feature" onclick="openModal('stock')">
      <div class="icon pink">📦</div>
      <h3>مخزون ذكي بالمقاسات</h3>
      <p>لما مقاس معين يخلص، بيختفي أوتوماتيك من صفحه البيع. لا حرج مع العميل تاني.</p>
      <div class="more">اعرف أكتر <span class="arrow">←</span></div>
    </button>
    <button class="feature" onclick="openModal('wa')">
      <div class="icon green">💬</div>
      <h3>الطلبات على واتساب</h3>
      <p>العميل بيدوس اطلب، بيتفتحله واتسابك برساله جاهزه فيها كل تفاصيل الطلب والعنوان.</p>
      <div class="more">اتواصل معانا <span class="arrow">←</span></div>
    </button>
    <button class="feature" onclick="openModal('invoices')">
      <div class="icon amber">🧾</div>
      <h3>فواتير مشتريات ومبيعات</h3>
      <p>سجّل كل عمليات الشراء والبيع، وشوف رصيد الخزنه ومكسبك في أي وقت.</p>
      <div class="more">اعرف أكتر <span class="arrow">←</span></div>
    </button>
    <button class="feature" onclick="openModal('sections')">
      <div class="icon blue">🏷️</div>
      <h3>أقسام مخصوصه</h3>
      <p>اعمل أقسام زي "عروض الصيف" أو "وصل حديثًا"، وحط منتجاتك فيهم.</p>
      <div class="more">اعرف أكتر <span class="arrow">←</span></div>
    </button>
    <button class="feature" onclick="openModal('ai')">
      <div class="icon rose">🤖</div>
      <h3>مساعد ذكاء اصطناعي</h3>
      <p>اسأله أي سؤال أو قدم اقتراحك لتحسين التطبيق — الرد فوري.</p>
      <div class="more">جرب المساعد <span class="arrow">←</span></div>
    </button>
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
      <p>هتاخد لينك مباشر شاركه على السوشيال ميديا، والطلبات هتوصلك على واتساب.</p>
    </div>
  </div>
</section>

<section class="final-cta">
  <h2>جاهز تبدأ؟</h2>
  <p>افتح متجرك دلوقتي مجانًا — ماتحتاجش كارت ائتمان ولا رسوم شهريه، وابدأ تستقبل طلبات عملائك في نفس اليوم.</p>
  <a href="${registerUrl}" class="btn btn-white">🚀 ابدأ متجرك دلوقتي — مجانًا</a>
</section>

<footer>
  <div><span class="brand-mark">🛍️</span><span class="m">متجري</span></div>
  <div class="links">
    <a href="${loginUrl}">تسجيل الدخول</a>
    <span>·</span>
    <a href="${registerUrl}">إنشاء حساب</a>
    <span>·</span>
    <a href="/terms">شروط الاستخدام</a>
    <span>·</span>
    <a href="/privacy">سياسه الخصوصيه</a>
    <span>·</span>
    <button onclick="openModal('wa')" style="background:transparent;border:none;color:#94A3B8;cursor:pointer;font-family:inherit;font-size:13px;padding:0;">تواصل معنا</button>
  </div>
  <div>صنع بحب لأصحاب المشاريع الصغيره 💜</div>
</footer>

<!-- ========== MODALS ========== -->

<!-- Design modal -->
<div class="modal-backdrop" id="modal-design" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF)">🎨</div>
      <h3>تصميم مخصوص لكل مجال</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>كل مجال في متجري بيجيله تصميم صفحه بيع مختلف — الألوان، الخطوط، الفلاتر، وحتى شكل كارت المنتج بيتغير حسب طبيعه اللي بتبيعه:</p>
      <div class="theme-grid">
        <div class="theme-card">
          <div class="preview" style="background:linear-gradient(135deg,#B84A64,#F5CBD6)">🧒</div>
          <div class="caption"><b>ملابس أطفال</b><span>وردي، فلاتر أولادي/بناتي</span></div>
        </div>
        <div class="theme-card">
          <div class="preview" style="background:linear-gradient(135deg,#5B3A29,#C8A97E)">🧴</div>
          <div class="caption"><b>عطور</b><span>ذهبي، فلاتر بالحجم</span></div>
        </div>
        <div class="theme-card">
          <div class="preview" style="background:linear-gradient(135deg,#1F4E5F,#4A9BA8)">👟</div>
          <div class="caption"><b>أحذية</b><span>أزرق داكن، مقاسات</span></div>
        </div>
        <div class="theme-card">
          <div class="preview" style="background:linear-gradient(135deg,#1E293B,#3B82F6)">📱</div>
          <div class="caption"><b>إكسسوارات موبايل</b><span>مودرن، فلاتر بالجهاز</span></div>
        </div>
      </div>
      <div class="default-note">
        <b>ملاحظه:</b> دي التصميمات الافتراضيه اللي بنجهزها لكل مجال. لو عندك تصميم مختلف عاوز تستخدمه، اكتبلنا وصف أو رابط للتصميم واحنا هنشوف نطبقه.
      </div>
      <h4>عندك فكره تصميم مختلف؟ ابعتلنا</h4>
      <form class="modal-form" onsubmit="submitFeedback(event, 'design_suggestion')">
        <input type="text" name="contact" placeholder="واتساب أو إيميل (اختياري)">
        <textarea name="message" required placeholder="اكتب فكرتك — ألوان معينه، شكل معين، أو ارفق رابط لتصميم مرجعي..."></textarea>
        <button type="submit">📤 ابعت الاقتراح</button>
      </form>
      <div class="form-msg"></div>
    </div>
  </div>
</div>

<!-- Stock modal -->
<div class="modal-backdrop" id="modal-stock" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#FCE7F3,#FBCFE8)">📦</div>
      <h3>مخزون ذكي بالمقاسات</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>لما بتضيف منتج، بتحدد كل مقاسات/أحجام متوفره منه (زي 2-3، 4-5، 6-7 لملابس الأطفال، أو 30ml، 50ml للعطور).</p>
      <h4>إزاي بيشتغل؟</h4>
      <ul>
        <li>في <b>فاتوره المشتريات</b>: تسجّل كام قطعه جاتلك من كل مقاس على حده</li>
        <li>في <b>فاتوره المبيعات</b>: تسجّل كام قطعه اتباعت من كل مقاس</li>
        <li>على <b>صفحه البيع</b>: العميل يشوف بس المقاسات المتوفره فعلاً — الي خلص بيختفي من القايمه</li>
        <li>لو كل المقاسات خلصت، المنتج نفسه بيبقى عليه علامه "نفدت الكميه"</li>
      </ul>
      <div class="default-note">
        <b>لماذا ده مهم؟</b> عشان ما يحصلش موقف إن عميل يطلب مقاس مش موجود، ويتصرف معاك بشكل سيء.
      </div>
    </div>
  </div>
</div>

<!-- WhatsApp modal -->
<div class="modal-backdrop" id="modal-wa" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#D1FAE5,#A7F3D0)">💬</div>
      <h3>اتواصل معانا على واتساب</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>عندك سؤال قبل ما تسجل؟ محتاج تفاصيل أكتر عن التطبيق؟ ابعتلنا واتساب فورًا:</p>
      <div class="wa-hero">
        <div class="num">+20 104 077 3728</div>
        <a href="${waLink}" target="_blank" class="btn btn-whatsapp">💬 افتح واتساب دلوقتي</a>
      </div>
      <h4>كمان في حاجات ممكن نجاوبك عليها:</h4>
      <ul>
        <li>هل التطبيق مجاني فعلاً؟ إيه اللي مدفوع فيه؟</li>
        <li>إزاي أضيف مجالي لو مش موجود في القايمه؟</li>
        <li>ممكن تعمل تصميم مخصوص لمتجري؟</li>
        <li>إزاي أنقل بيانات متجري القديم لهنا؟</li>
      </ul>
    </div>
  </div>
</div>

<!-- Invoices modal -->
<div class="modal-backdrop" id="modal-invoices" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A)">🧾</div>
      <h3>فواتير مشتريات ومبيعات + خزنه</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>محاسبه بسيطه لأصحاب المتاجر الصغيره — بدون تعقيدات ولا برامج محاسبه معقده:</p>
      <h4>فاتوره المشتريات 🛒</h4>
      <ul>
        <li>سجّل أي بضاعه بتشتريها بسعرها الأصلي</li>
        <li>حدد الكميه لكل مقاس/حجم</li>
        <li>المخزون بيتحدث تلقائي</li>
      </ul>
      <h4>فاتوره المبيعات 🧾</h4>
      <ul>
        <li>سجّل كل عمليه بيع (سواء من الأونلاين أو حتى من المحل)</li>
        <li>الكميه بتنزل من المخزون تلقائي</li>
        <li>تقدر تحط اسم العميل كملاحظه</li>
      </ul>
      <h4>الخزنه 💰</h4>
      <ul>
        <li>رصيد الخزنه بيتحسب تلقائي (مبيعات - مشتريات - مصروفات)</li>
        <li>تقدر تضيف دخل إضافي أو تسجّل مصروف (زي مصاريف الشحن، فواتير)</li>
        <li>لوحه بتوريلك مبيعات النهارده والرصيد الحالي</li>
      </ul>
    </div>
  </div>
</div>

<!-- Sections modal -->
<div class="modal-backdrop" id="modal-sections" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#DBEAFE,#BFDBFE)">🏷️</div>
      <h3>أقسام مخصوصه لمتجرك</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>ماتنساش إن كل مجال ليه فلاتر جاهزه (زي أولادي/بناتي لملابس الأطفال، أو رجالي/حريمي للعطور). القصه هنا في <b>أقسام مخصوصه إنت اللي بتنشئها</b>:</p>
      <h4>أمثله:</h4>
      <ul>
        <li>"عروض الصيف" — تحط فيها كل المنتجات المخفضه</li>
        <li>"وصل حديثًا" — لكل جديد</li>
        <li>"عروض العيد" — موسميه</li>
        <li>"الأكثر مبيعًا" — للترشيح</li>
      </ul>
      <p>الأقسام بتظهر كـ <b>Filter Chips</b> فوق منتجاتك في صفحه البيع، والعميل يقدر يفلتر بيها.</p>
      <div class="default-note">
        بتضيف الأقسام من الإعدادات، وبتنسب المنتج للقسم لما تضيفه أو تعدله.
      </div>
    </div>
  </div>
</div>

<!-- AI Chat modal -->
<div class="modal-backdrop" id="modal-ai" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-head">
      <div class="icon" style="background:linear-gradient(135deg,#FFE4E6,#FECACA)">🤖</div>
      <h3>مساعد ذكاء اصطناعي</h3>
      <button class="x" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>اسأل أي سؤال عن التطبيق — أو قدم اقتراحك لتحسينه. كل ما بتبعته بيوصل للفريق ويتحط في خطه التطوير 💜</p>
      <div class="aic">
        <div class="aic-body" id="aic-body">
          <div class="aic-msg bot">أهلاً! أنا مساعدك الذكي 🤖 اسألني عن أي حاجه: إيه المجالات المدعومه، إزاي التسجيل، الأسعار، أو أي اقتراح لتحسين التطبيق.</div>
        </div>
        <form class="aic-input" onsubmit="sendAI(event)">
          <input type="text" id="aic-in" placeholder="اكتب سؤالك أو اقتراحك..." autocomplete="off" required>
          <button type="submit" id="aic-btn">➤</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
  // ==== Modal helpers ====
  function openModal(id) {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    const m = document.getElementById('modal-' + id);
    if (!m) return;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    // focus first input/textarea if present
    setTimeout(() => {
      const inp = m.querySelector('input, textarea');
      if (inp) inp.focus();
    }, 100);
  }
  function closeModal() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ==== Design suggestion form ====
  async function submitFeedback(e, type) {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    const msgBox = form.parentElement.querySelector('.form-msg');
    const data = new FormData(form);
    const payload = {
      type: type,
      message: data.get('message'),
      contact: data.get('contact') || '',
    };
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    msgBox.innerHTML = '';
    try {
      const r = await fetch('/api/marketing/feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json;charset=UTF-8'},
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        msgBox.innerHTML = '<div class="form-ok">' + (d.reply || 'تمام! اقتراحك وصلنا 💜') + '</div>';
        form.reset();
      } else {
        msgBox.innerHTML = '<div class="form-err">حصل خطأ، جرب تاني.</div>';
      }
    } catch (err) {
      msgBox.innerHTML = '<div class="form-err">تأكد من النت وجرب تاني.</div>';
    } finally {
      btn.disabled = false;
      btn.textContent = '📤 ابعت الاقتراح';
    }
  }

  // ==== AI chat ====
  const aiHistory = [];
  async function sendAI(e) {
    e.preventDefault();
    const inp = document.getElementById('aic-in');
    const btn = document.getElementById('aic-btn');
    const body = document.getElementById('aic-body');
    const text = inp.value.trim();
    if (!text) return;
    const um = document.createElement('div'); um.className = 'aic-msg user'; um.textContent = text;
    body.appendChild(um);
    aiHistory.push({role: 'user', content: text});
    inp.value = ''; btn.disabled = true;
    const t = document.createElement('div'); t.className = 'aic-typing'; t.textContent = 'بيكتب...'; body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    try {
      const r = await fetch('/api/marketing/ai-chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json;charset=UTF-8'},
        body: JSON.stringify({messages: aiHistory}),
      });
      const d = await r.json();
      t.remove();
      const reply = (d.reply || 'شكرًا! هنراجع رسالتك ونرد قريب.').trim();
      const bm = document.createElement('div'); bm.className = 'aic-msg bot'; bm.textContent = reply;
      body.appendChild(bm);
      aiHistory.push({role: 'assistant', content: reply});
    } catch (err) {
      t.remove();
      const em = document.createElement('div'); em.className = 'aic-msg bot'; em.textContent = 'مشكله في الاتصال، جرب تاني.'; body.appendChild(em);
    } finally {
      btn.disabled = false; body.scrollTop = body.scrollHeight; inp.focus();
    }
  }
</script>
</body>
</html>`;
}

module.exports = { renderMarketing };
