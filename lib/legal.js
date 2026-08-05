// legal.js — public Terms of Use and Privacy Policy pages, tailored to the
// current state of the platform (free, WhatsApp-based orders, no payment
// processing yet, Egyptian merchants + customers).

const SUPPORT_EMAIL = 'mustafaabdelbaky0@gmail.com';
const SUPPORT_WHATSAPP = '201040773728';
const LAST_UPDATED = '5 أغسطس 2026';

function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — متجري</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --brand:#4F46E5; --brand-2:#7C3AED; --ink:#0F172A; --ink-soft:#475569;
    --line:#E2E8F0; --bg:#F8FAFC; --card:#FFFFFF;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:'Cairo',sans-serif;color:var(--ink);background:var(--bg);line-height:1.75}
  header{background:#fff;border-bottom:1px solid var(--line);padding:14px 0;position:sticky;top:0;z-index:20}
  .wrap{max-width:820px;margin:0 auto;padding:0 20px}
  .header-inner{display:flex;justify-content:space-between;align-items:center;gap:12px}
  .brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink)}
  .brand-mark{width:36px;height:36px;background:linear-gradient(135deg,var(--brand),var(--brand-2));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800}
  .brand-name{font-weight:800;font-size:17px}
  .back-btn{color:var(--brand);text-decoration:none;font-weight:700;font-size:14px}
  main{padding:28px 0 60px}
  .doc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 26px;box-shadow:0 2px 10px rgba(15,23,42,.03)}
  h1{margin:0 0 6px;font-size:28px;font-weight:800}
  .meta{color:var(--ink-soft);font-size:13px;margin:0 0 22px;padding-bottom:16px;border-bottom:1px solid var(--line)}
  h2{margin:26px 0 10px;font-size:19px;font-weight:800;color:var(--brand)}
  h2::before{content:"";display:inline-block;width:4px;height:18px;background:var(--brand);border-radius:2px;margin-inline-end:8px;vertical-align:-3px}
  p,li{color:#1E293B;font-size:15.5px}
  ul{padding-inline-start:22px;margin:8px 0}
  li{margin:6px 0}
  .note{background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:12px 14px;color:#3730A3;font-size:14px;margin:16px 0}
  .contact{background:#F1F5F9;border-radius:12px;padding:16px 18px;margin-top:24px}
  .contact a{color:var(--brand);font-weight:700;text-decoration:none}
  .tabs{display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap}
  .tab{background:#fff;border:1.5px solid var(--line);color:var(--ink);padding:8px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px}
  .tab.active{background:var(--brand);color:#fff;border-color:var(--brand)}
</style>
</head>
<body>
<header><div class="wrap header-inner">
  <a class="brand" href="/"><div class="brand-mark">م</div><div class="brand-name">متجري</div></a>
  <a class="back-btn" href="/">← الرجوع للصفحه الرئيسيه</a>
</div></header>
<main><div class="wrap">${bodyHtml}</div></main>
</body>
</html>`;
}

function tabs(active) {
  return `<div class="tabs">
    <a class="tab ${active === 'terms' ? 'active' : ''}" href="/terms">شروط الاستخدام</a>
    <a class="tab ${active === 'privacy' ? 'active' : ''}" href="/privacy">سياسه الخصوصيه</a>
  </div>`;
}

function renderTerms() {
  const body = `${tabs('terms')}<div class="doc">
    <h1>شروط استخدام متجري</h1>
    <p class="meta">آخر تحديث: ${LAST_UPDATED}</p>

    <h2>مقدمه</h2>
    <p>أهلاً بيك في <strong>متجري</strong> — منصه لفتح متاجر أونلاين للتجار المصريين. باستخدامك للمنصه، أنت بتوافق على الشروط دي. لو مش موافق، برجاء عدم استخدام الخدمه.</p>

    <h2>1. طبيعه الخدمه</h2>
    <ul>
      <li>متجري بيدّي التاجر أدوات لعرض منتجاته ومتابعه مخزونه وطلباته.</li>
      <li>الطلبات بتتوجه من العميل للتاجر مباشره عبر <strong>واتساب</strong> — متجري مش وسيط في الشراء أو الدفع.</li>
      <li>متجري <strong>مش بيعالج مدفوعات</strong>. أي معامله ماليه بتحصل مباشره بين التاجر والعميل خارج المنصه.</li>
    </ul>

    <h2>2. تسجيل الحساب</h2>
    <ul>
      <li>بتلتزم إن البيانات الي بتكتبها (اسم، تليفون، اسم المتجر) صحيحه.</li>
      <li>مسؤول عن أمان كلمه السر بتاعتك — مش المفروض تشاركها مع حد.</li>
      <li>حساب واحد للتاجر الواحد. ممنوع إنشاء حسابات وهميه أو مضلله.</li>
    </ul>

    <h2>3. مسؤوليه التاجر</h2>
    <ul>
      <li>المنتجات الي بتعرضها لازم تكون <strong>حقيقيه وقانونيه</strong> في مصر.</li>
      <li>ممنوع عرض: مواد مقلده، أدويه، أسلحه، محتوى إباحي، أو أي حاجه مخالفه للقانون المصري.</li>
      <li>الأسعار والوصف لازم يكونوا واضحين ومش مضلليين للعميل.</li>
      <li>أنت المسؤول الوحيد عن التعامل مع عملائك (شحن، مرتجعات، خدمه بعد البيع).</li>
    </ul>

    <h2>4. بيانات العملاء</h2>
    <ul>
      <li>لما العميل بيطلب من متجرك، بياناته (اسم، تليفون، عنوان) بتوصلك على واتساب مباشره.</li>
      <li>أنت المسؤول عن <strong>حمايه بيانات عملائك</strong> وعدم استخدامها في غير الغرض الي جمعت علشانه.</li>
      <li>ممنوع بيع أو مشاركه بيانات العملاء مع طرف تالت.</li>
    </ul>

    <h2>5. المحتوى والملكيه</h2>
    <ul>
      <li>الصور والأوصاف الي بترفعها ملكك، وأنت مسؤول إنها مش منسوخه من غيرك بدون إذن.</li>
      <li>بتدّي متجري رخصه لعرض المحتوى ده على صفحه متجرك العامه.</li>
      <li>تصميم المنصه والكود ملك متجري.</li>
    </ul>

    <h2>6. الخدمه المجانيه دلوقتي</h2>
    <div class="note">حاليًا الخدمه مجانيه بالكامل بدون حد. مستقبلاً، ممكن نضيف باقات مدفوعه بمزايا إضافيه. لو ده حصل، هنبلغك قبل التطبيق بوقت كافي، وحسابك ومنتجاتك الحاليه هيفضلوا شغالين.</div>

    <h2>7. تعليق أو إلغاء الحساب</h2>
    <ul>
      <li>يحق لمتجري تعليق حسابك لو اكتشفنا مخالفه للشروط دي.</li>
      <li>يحق لك حذف حسابك في أي وقت بالتواصل معانا.</li>
      <li>بعد الحذف، البيانات بتاعتك بتتشال خلال 30 يوم.</li>
    </ul>

    <h2>8. حدود المسؤوليه</h2>
    <p>متجري بيقدم الخدمه "كما هي". مش مسؤولين عن أي خساره ماديه أو أدبيه ناتجه من:</p>
    <ul>
      <li>خلافات بين التاجر والعميل.</li>
      <li>انقطاع مؤقت للخدمه لأسباب فنيه.</li>
      <li>سوء استخدام حساب التاجر من قِبل شخص تاني.</li>
    </ul>

    <h2>9. تعديل الشروط</h2>
    <p>ممكن نعدل الشروط دي وقت الحاجه. لو التعديل مؤثر، هنبعتلك إشعار قبل التطبيق. الاستمرار في استخدام المنصه بعد التعديل يعني قبولك للنسخه الجديده.</p>

    <h2>10. القانون الحاكم</h2>
    <p>الشروط دي خاضعه لأحكام القانون المصري. أي نزاع بيتم حله ودياً أولاً، ولو ما اتحلش بيتقدم للجهات القضائيه المختصه في القاهره.</p>

    <div class="contact">
      <strong>عندك سؤال؟</strong><br>
      اتواصل معانا على: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/${SUPPORT_WHATSAPP}" target="_blank">واتساب</a>
    </div>
  </div>`;
  return layout('شروط الاستخدام', body);
}

function renderPrivacy() {
  const body = `${tabs('privacy')}<div class="doc">
    <h1>سياسه الخصوصيه</h1>
    <p class="meta">آخر تحديث: ${LAST_UPDATED}</p>

    <h2>مقدمه</h2>
    <p>خصوصيتك مهمه عندنا. الوثيقه دي بتوضح إيه البيانات الي بنجمعها من التجار وعملائهم، ليه، وإزاي بنحميها.</p>

    <h2>1. البيانات الي بنجمعها من التاجر</h2>
    <ul>
      <li><strong>وقت التسجيل:</strong> الاسم، رقم التليفون، كلمه السر (مشفّره)، اسم المتجر.</li>
      <li><strong>وقت الاستخدام:</strong> بيانات المنتجات والمخزون والفواتير الي بتضيفها.</li>
      <li><strong>تلقائيًا:</strong> عنوان IP، وقت تسجيل الدخول (لأمان الحساب).</li>
    </ul>

    <h2>2. البيانات الي بتتجمع من عملاء المتجر</h2>
    <p>لما زبون بيطلب من متجرك، البيانات الي بتتجمع هي:</p>
    <ul>
      <li>الاسم، رقم التليفون، المحافظه، العنوان.</li>
      <li>المنتجات الي طلبها.</li>
    </ul>
    <div class="note">البيانات دي <strong>بتتبعت مباشره لك عبر واتساب</strong> — متجري ما بيخزنش تفاصيل الطلب في السيرفر. الطلب بيعدي من متصفح العميل لواتساب بتاعك مباشره.</div>

    <h2>3. إزاي بنستخدم البيانات</h2>
    <ul>
      <li>لتشغيل حسابك (تسجيل دخول، إداره متجرك).</li>
      <li>لعرض متجرك للعملاء.</li>
      <li>للتواصل معاك بخصوص خدمتك (تحديثات، مشاكل فنيه).</li>
      <li>لتحسين المنصه (إحصائيات مجهوله الهويه).</li>
    </ul>

    <h2>4. مين يقدر يشوف بياناتك؟</h2>
    <ul>
      <li><strong>أنت فقط</strong> بتشوف بيانات متجرك ومنتجاتك ومبيعاتك في لوحه التحكم.</li>
      <li>ما بنبيعش أو نأجّرش بياناتك لأي طرف تالت.</li>
      <li>ممكن نشارك بيانات محدوده مع مزودي الخدمه (استضافه، تخزين صور) بس بشكل مشفّر ومحدود.</li>
    </ul>

    <h2>5. مزودي الخدمه الي بنستخدمهم</h2>
    <ul>
      <li><strong>Vercel</strong> — لاستضافه الموقع.</li>
      <li><strong>Neon Postgres</strong> — لتخزين بيانات الحسابات والمنتجات.</li>
      <li><strong>Vercel Blob</strong> — لتخزين صور المنتجات.</li>
      <li><strong>Anthropic Claude</strong> — لتشغيل المساعد الذكي (بس محتوى الشات، مش بيانات حسابك).</li>
      <li><strong>WhatsApp</strong> — لإرسال الطلبات (خارج نطاق تحكمنا، خاضع لسياسه واتساب).</li>
    </ul>

    <h2>6. الكوكيز (Cookies)</h2>
    <p>بنستخدم كوكي واحد بس: <code>session</code> — عشان نفتكرك بعد ما تسجل دخول. مش بنستخدم كوكيز للإعلانات أو التتبع.</p>

    <h2>7. مده الاحتفاظ بالبيانات</h2>
    <ul>
      <li>بيانات الحساب: طول ما الحساب شغال.</li>
      <li>بعد حذف الحساب: بتتشال خلال 30 يوم.</li>
      <li>سجلات تسجيل الدخول: 90 يوم (لأغراض أمنيه).</li>
    </ul>

    <h2>8. حقوقك</h2>
    <ul>
      <li>حقك تشوف كل بياناتك الي عندنا.</li>
      <li>حقك تعدلها أو تحذفها.</li>
      <li>حقك تسحب موافقتك في أي وقت (بحذف حسابك).</li>
      <li>حقك تطلب نسخه من بياناتك.</li>
    </ul>

    <h2>9. أمان البيانات</h2>
    <ul>
      <li>كلمات السر بتتخزن مشفّره (scrypt).</li>
      <li>الاتصال بالسيرفر عبر HTTPS.</li>
      <li>الوصول للسيرفر محدود ومحمي.</li>
    </ul>
    <p>لكن ما فيش نظام آمن 100٪. لو حصل اختراق مؤثر، هنبلغك خلال 72 ساعه.</p>

    <h2>10. الأطفال</h2>
    <p>الخدمه مخصصه للأشخاص فوق 18 سنه. لو عرفنا إن حساب بتاع طفل، هنشيله فورًا.</p>

    <h2>11. تعديل السياسه</h2>
    <p>ممكن نحدث سياسه الخصوصيه دي. أي تعديل مؤثر هيتم إبلاغك بيه قبل التطبيق.</p>

    <div class="contact">
      <strong>عاوز تحذف حسابك أو تشوف بياناتك؟</strong><br>
      اتواصل معانا على: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/${SUPPORT_WHATSAPP}" target="_blank">واتساب</a>
    </div>
  </div>`;
  return layout('سياسه الخصوصيه', body);
}

module.exports = { renderTerms, renderPrivacy };
