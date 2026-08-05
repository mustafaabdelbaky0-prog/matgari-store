// marketing.js — endpoints for the public landing page.
// - GET /demo: a pre-built showroom store (no DB, always works)
// - POST /api/marketing/feedback: save visitor suggestions to `feedback` table
// - POST /api/marketing/ai-chat: same, but if ANTHROPIC_API_KEY is set the
//   message is also answered by Claude Haiku. Either way, the message is
//   saved so the developer sees every question and suggestion.

const { exec } = require('../lib/db');
const { parseBody } = require('../lib/body');
const { sendJson } = require('../lib/http-helpers');

const SYSTEM_PROMPT = `أنت مساعد تسويقي ذكي لتطبيق **متجري** — منصه لفتح متاجر أونلاين بسرعه.

# عن التطبيق (بشكل مختصر):
- متجري بيدّي أي حد تطبيق كامل لفتح متجر أونلاين مجانًا في دقايق
- بيدعم مجالات كتير: ملابس أطفال، عطور، أحذية، إكسسوارات موبايل، ملابس شبابي، إكسسوارات حريمي، أدوات منزلية، مواد تعبئه وتغليف
- كل مجال بتصميم مخصوص (ألوان وخطوط وفلاتر)
- إدارة مخزون ذكيه بالمقاسات - المقاس الي بيخلص بيختفي أوتوماتيك من صفحه البيع
- الطلبات بتوصل التاجر على واتساب مع كل التفاصيل
- فيه مساعد ذكاء اصطناعي داخل التطبيق (وأنت واحد منهم) بيرد على أسئله المستخدمين
- كل ده مجانًا للبدايه، بدون كارت ائتمان

# شخصيتك:
- زائر جديد لسه ما سجّلش، بيسأل قبل ما يجرب — كن ودود ومساعد ومختصر
- لو عنده سؤال، جاوب بدقه
- لو عنده اقتراح، اشكره وقول له إن اقتراحه هيوصل للفريق
- لو مش متأكد، قول إنك هتحول السؤال لصاحب المنصه
- شجع الزائر يجرب مجانًا لو الفرصه مناسبه
- إجاباتك مختصره ومفيده (٤ سطور كحد أقصى)

# لو عنده مشكله فنيه بعد ما يسجل، اطلب منه يستخدم مساعد الدعم الفني داخل لوحه التحكم بعد تسجيل الدخول`;

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || null;
}

async function saveFeedback(type, message, contact, req) {
  try {
    await exec(
      'INSERT INTO feedback (type, message, contact, source_ip) VALUES ($1, $2, $3, $4)',
      [type, (message || '').slice(0, 4000), (contact || '').slice(0, 200) || null, getClientIP(req)]
    );
  } catch (err) {
    console.error('[feedback save]', err);
  }
}

function registerRoutes(router) {
  // Feedback / suggestion submission (design ideas, general).
  router.post('/api/marketing/feedback', async (req, res) => {
    try {
      const body = await parseBody(req);
      const type = String(body.type || 'general').slice(0, 50);
      const message = String(body.message || '').trim();
      const contact = String(body.contact || '').trim();
      if (!message) return sendJson(res, 400, { error: 'empty_message' });
      if (message.length > 4000) return sendJson(res, 400, { error: 'too_long' });
      await saveFeedback(type, message, contact, req);
      return sendJson(res, 200, {
        ok: true,
        reply: 'تمام! اقتراحك وصلنا وهيتحط في خطه التطوير. لو حبيت تتابع، سجّل حساب مجانًا ونتواصل معاك 💜',
      });
    } catch (err) {
      console.error('[marketing feedback]', err);
      return sendJson(res, 500, { error: 'internal' });
    }
  });

  // AI chat for pre-signup questions. Saves every message + optionally answers
  // via Claude when the API key is available.
  router.post('/api/marketing/ai-chat', async (req, res) => {
    try {
      const body = await parseBody(req);
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (messages.length === 0) return sendJson(res, 400, { error: 'no_messages' });
      const last = messages[messages.length - 1];
      if (!last || last.role !== 'user' || typeof last.content !== 'string' || !last.content.trim()) {
        return sendJson(res, 400, { error: 'invalid_history' });
      }
      // Save every question — even if AI is offline, the developer sees it.
      await saveFeedback('ai_chat', last.content, null, req);

      if (!process.env.ANTHROPIC_API_KEY) {
        return sendJson(res, 200, {
          reply: 'سؤالك وصلني وهبعته للفريق يرد عليك 🙏 لو حبيت رد فوري، سجّل حساب مجانًا ودوس زرار المساعد الذكي في لوحه التحكم.',
        });
      }

      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic();
      const cleaned = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: cleaned,
      });
      const reply = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return sendJson(res, 200, { reply: reply || 'شكرًا! هنراجع سؤالك ونرد عليك قريب.' });
    } catch (err) {
      console.error('[marketing ai-chat]', err);
      return sendJson(res, 200, {
        reply: 'حصل خطأ صغير، بس سؤالك اتحفظ عندنا وهنرد عليك 🙏',
      });
    }
  });

  // Static, always-works demo store — no DB dependency.
  router.get('/demo', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDemoStore());
  });
}

function renderDemoStore() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>متجر تجريبي — متجري</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#FBF3EC; --card:#FFFFFF; --blush:#F5CBD6; --rose:#D9647E;
    --rose-deep:#B84A64; --sage:#9FBF9A; --ink:#3C2E2E; --ink-soft:#7A6A68;
    --line:#EDE0D8; --radius:18px;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);font-family:'Cairo',sans-serif;color:var(--ink);padding-bottom:80px}
  h1,h2,h3{font-family:'Baloo 2',sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:0 18px}

  .demo-badge{position:fixed;top:14px;inset-inline-start:14px;z-index:100;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:800;box-shadow:0 8px 20px rgba(79,70,229,.35)}
  .demo-badge a{color:#fff;text-decoration:none;margin-inline-start:8px;padding-inline-start:8px;border-inline-start:1px solid rgba(255,255,255,.35)}

  header{padding:16px 0;border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:20}
  .header-inner{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .logo{display:flex;align-items:center;gap:10px}
  .logo-mark{width:42px;height:42px;border-radius:50%;background:var(--blush);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px}
  .logo-text .name{font-size:18px;font-weight:800;color:var(--rose-deep)}
  .logo-text .tag{font-size:10.5px;color:var(--ink-soft)}
  .cart-btn{background:var(--rose-deep);color:#fff;border:none;padding:10px 18px;border-radius:999px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px}
  .cart-btn .n{background:#fff;color:var(--rose-deep);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}

  .top-note{text-align:center;font-size:13px;color:var(--rose-deep);background:var(--blush);padding:9px 10px;font-weight:600}

  .offer-banner{background:linear-gradient(90deg,var(--rose-deep),var(--rose));color:#fff;border-radius:20px;padding:24px 26px;margin:24px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
  .offer-banner h2{margin:0 0 4px;font-size:22px}
  .offer-banner p{margin:0;font-size:14px;opacity:.92}
  .filter-row{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 20px}
  .fchip{padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:var(--ink)}
  .fchip.active{background:var(--rose-deep);color:#fff;border-color:var(--rose-deep)}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px;margin-bottom:40px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
  .card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(60,46,46,.10)}
  .card-img{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:60px;color:#fff}
  .card-img.p1{background:linear-gradient(135deg,#F5CBD6,#D9647E)}
  .card-img.p2{background:linear-gradient(135deg,#B84A64,#7A2E44)}
  .card-img.p3{background:linear-gradient(135deg,#9FBF9A,#5F8C5C)}
  .card-img.p4{background:linear-gradient(135deg,#F5CBD6,#B84A64)}
  .card-img.p5{background:linear-gradient(135deg,#FBB6A5,#E88671)}
  .card-img.p6{background:linear-gradient(135deg,#D9647E,#F5CBD6)}
  .card-body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
  .card-body h3{font-size:15px;margin:0;color:var(--ink);line-height:1.4}
  .card-desc{font-size:12px;color:var(--ink-soft);line-height:1.5}
  .card-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .card-price .new{font-size:20px;font-weight:800;color:var(--rose-deep);line-height:1}
  .card-price .new small{font-size:12px;font-weight:600;margin-inline-start:2px}
  .card-price .old{font-size:13px;color:var(--ink-soft);text-decoration:line-through}
  .add-btn{margin-top:auto;background:var(--rose-deep);color:#fff;border:none;padding:11px;border-radius:10px;font-family:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
  .add-btn:hover{background:var(--rose)}

  footer{text-align:center;padding:26px 20px;color:var(--ink-soft);font-size:13px}
  footer a{color:var(--rose-deep);font-weight:700}
</style>
</head>
<body>

<div class="demo-badge">
  🎯 هذا متجر تجريبي
  <a href="/">← ارجع للصفحه الرئيسيه</a>
</div>

<div class="top-note">🚚 التوصيل لكل محافظات مصر | الدفع عند الاستلام</div>

<header>
  <div class="wrap header-inner">
    <div class="logo">
      <div class="logo-mark">🎀</div>
      <div class="logo-text">
        <div class="name">Laila Kids Wear</div>
        <div class="tag">Little Styles, Big Smiles</div>
      </div>
    </div>
    <button class="cart-btn" onclick="alert('ده متجر تجريبي بس — سجّل من الصفحه الرئيسيه عشان تعمل متجرك 💜')">🛍️ السله <span class="n">0</span></button>
  </div>
</header>

<main class="wrap">
  <div class="offer-banner">
    <div>
      <h2>عرض تيشرتات الأطفال الأوفر سايز</h2>
      <p>كل ما تزودي القطع، كل ما وفرتي أكتر</p>
    </div>
  </div>

  <div class="filter-row">
    <button class="fchip active">الكل</button>
    <button class="fchip">أولادي</button>
    <button class="fchip">بناتي</button>
    <button class="fchip">أطقم</button>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-img p1">🦸</div>
      <div class="card-body">
        <h3>تيشرت سبايدرمان أوفر سايز</h3>
        <div class="card-desc">قطن 100٪، مقاسات 2-9 سنين</div>
        <div class="card-price"><span class="new">300<small>ج.م</small></span><span class="old">350 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
    <div class="card">
      <div class="card-img p2">🦇</div>
      <div class="card-body">
        <h3>تيشرت باتمان أوفر سايز</h3>
        <div class="card-desc">قطن 100٪، مقاسات 2-9 سنين</div>
        <div class="card-price"><span class="new">300<small>ج.م</small></span><span class="old">350 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
    <div class="card">
      <div class="card-img p3">👗</div>
      <div class="card-body">
        <h3>تيشرت باليرينا أوفر سايز</h3>
        <div class="card-desc">ألوان بناتي جميله</div>
        <div class="card-price"><span class="new">300<small>ج.م</small></span><span class="old">350 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
    <div class="card">
      <div class="card-img p4">❄️</div>
      <div class="card-body">
        <h3>تيشرت فروزين أوفر سايز</h3>
        <div class="card-desc">من عالم ديزني — مقاسات 2-9</div>
        <div class="card-price"><span class="new">300<small>ج.م</small></span><span class="old">350 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
    <div class="card">
      <div class="card-img p5">🦊</div>
      <div class="card-body">
        <h3>طقم Summer Scoops</h3>
        <div class="card-desc">تيشرت + شورت — أطقم كامله</div>
        <div class="card-price"><span class="new">375<small>ج.م</small></span><span class="old">500 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
    <div class="card">
      <div class="card-img p6">🐻</div>
      <div class="card-body">
        <h3>طقم ستيتش جبردين</h3>
        <div class="card-desc">تيشرت + شورت جبردين مقاوم</div>
        <div class="card-price"><span class="new">550<small>ج.م</small></span><span class="old">650 ج.م</span></div>
        <button class="add-btn">🛒 أضيفي للسله</button>
      </div>
    </div>
  </div>
</main>

<footer>
  عاجبك التصميم ده؟ <a href="/register">ابدأ متجرك المجاني دلوقتي</a>
</footer>

<script>
  document.querySelectorAll('.fchip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.fchip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    });
  });
  document.querySelectorAll('.add-btn').forEach(b => {
    b.addEventListener('click', () => {
      alert('ده متجر تجريبي 🎯\\n\\nسجّل حساب مجانًا من الصفحه الرئيسيه واعمل متجرك الحقيقي في دقايق!');
    });
  });
</script>
</body>
</html>`;
}

module.exports = { registerRoutes };
