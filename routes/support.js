// support.js — AI-powered technical support via Claude.
// Uses claude-haiku-4-5 for fast, low-cost responses tuned to this app.

const Anthropic = require('@anthropic-ai/sdk');
const { getRequestMerchant } = require('../lib/req-context');
const { parseBody } = require('../lib/body');
const { sendJson } = require('../lib/http-helpers');
const { getCategoryConfig } = require('../lib/category-configs');

const SYSTEM_PROMPT = `أنت "مساعد متجري" - الدعم الفني الرسمي لتطبيق **متجري** (matgari-store).

# عن التطبيق:
متجري هو تطبيق سحابي لإدارة المتاجر الأونلاين، بيدعم كذا مجال:
- ملابس أطفال (بتصميم Laila Kids)
- عطور (بأحجام مل)
- أحذية
- إكسسوارات موبايل
- ملابس شبابي
- إكسسوارات حريمي
- أدوات منزلية
- مواد تعبئة وتغليف

# الفيتشرز الأساسية:
1. **صفحه بيع (Landing Page)** لكل تاجر بتصميم مخصوص حسب المجال، بتفتح على /store/[slug]
2. **إداره المخزون** - إضافة/تعديل/حذف منتجات مع صور وأوصاف
3. **فاتورة مشتريات** - التاجر بيسجل الكميه اللي جاتله من كل مقاس/حجم
4. **فاتورة مبيعات** - بينزل من المخزون بمقاس محدد
5. **الخزنه** - دخل ومصروفات
6. **الأقسام المخصوصه** - في الإعدادات، التاجر بيقدر يعمل أقسام زي "عروض الصيف" وينسب المنتجات ليها
7. **الأتربيوتس** - الألوان والمقاسات والأحجام - التاجر يقدر يضيف قيم مخصوصه بجانب الاقتراحات
8. **مخزون لكل مقاس** - لما مقاس يخلص، يختفي تلقائيًا من صفحه البيع
9. **إرسال الطلبات على واتساب** - العميل بيدوس اطلب، بيتفتحله واتس التاجر برساله جاهزه

# الشخصيه:
- تتكلم بالعربي (مصري) بشكل ودود ومساعد
- إجاباتك مختصره ومفيده
- لما تشرح خطوات، استخدم أرقام أو نقاط
- لو المستخدم عنده مشكله فنيه، اسأله عن التفاصيل قبل ما تجاوب
- لو عنده اقتراح لتحسين التطبيق، اشكره وقول له إن الاقتراح هيوصل للفريق
- لو حاجه خارج نطاق التطبيق، اعتذر بأدب واقترح البديل

# ما يجب تجنبه:
- ماتقولش معلومات مش متأكد منها
- ماتوعدش بفيتشرز مش موجوده
- ماتحاولش تحل مشكله بره التطبيق (مثلاً واتساب أو إعدادات الموبايل)`;

let clientInstance = null;
function client() {
  if (!clientInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    clientInstance = new Anthropic();
  }
  return clientInstance;
}

function buildUserContext(merchant) {
  if (!merchant) return '';
  const cfg = getCategoryConfig(merchant.category);
  const categoryLabel = cfg ? cfg.label : (merchant.category || 'غير محدد');
  return `\n\n[معلومات المستخدم الحالي: اسم المتجر "${merchant.store_name}"، المجال "${categoryLabel}"، رابط المتجر /store/${merchant.slug}]`;
}

function registerRoutes(router) {
  router.post('/api/support/chat', async (req, res) => {
    try {
      const merchant = await getRequestMerchant(req);
      if (!merchant) return sendJson(res, 401, { error: 'unauthorized' });

      const body = await parseBody(req);
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (messages.length === 0) return sendJson(res, 400, { error: 'no_messages' });

      // Sanitize + limit history
      const cleaned = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
      if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
        return sendJson(res, 400, { error: 'invalid_history' });
      }

      const response = await client().messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + buildUserContext(merchant),
        messages: cleaned,
      });

      const reply = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      return sendJson(res, 200, { reply });
    } catch (err) {
      console.error('[support]', err);
      if (err && err.message && err.message.includes('ANTHROPIC_API_KEY')) {
        return sendJson(res, 503, {
          error: 'not_configured',
          reply: 'الدعم الفني مش متفعّل حاليًا. لو أنت المسؤول، ضيف متغير ANTHROPIC_API_KEY في إعدادات Vercel.',
        });
      }
      return sendJson(res, 500, { error: 'internal', reply: 'حصل خطأ، حاول تاني بعد شويه.' });
    }
  });
}

module.exports = { registerRoutes };
