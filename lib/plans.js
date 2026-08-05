// plans.js — subscription plan catalog. Single source of truth for pricing
// and features across marketing, dashboard, and admin.

const PLANS = {
  trial: {
    id: 'trial',
    name: 'التجريبي',
    tagline: '30 يوم مجانًا',
    priceMonthly: 0,
    priceYearly: 0,
    ctaLabel: 'ابدأ مجانًا',
    highlight: false,
    features: [
      { text: 'كل الفيتشرز مفتوحه', ok: true },
      { text: 'منتجات بلا حد', ok: true },
      { text: 'مساعد ذكاء اصطناعي', ok: true },
      { text: 'بيقفل بعد 30 يوم', ok: false },
    ],
  },
  basic: {
    id: 'basic',
    name: 'الأساسي',
    tagline: 'للتجار الصغيره والمبتدئين',
    priceMonthly: 99,
    priceYearly: 999,
    yearlyDiscount: '17٪ خصم',
    ctaLabel: 'اشترك في الأساسي',
    highlight: false,
    features: [
      { text: 'كل الفيتشرز الأساسيه', ok: true },
      { text: 'منتجات بلا حد', ok: true },
      { text: 'إداره مخزون كامله', ok: true },
      { text: 'الطلبات على واتساب', ok: true },
      { text: 'دعم فني عادي', ok: true },
      { text: 'مساعد ذكاء اصطناعي (محدود)', ok: true },
      { text: 'شعار متجري في التذييل', ok: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'البرو',
    tagline: 'للتجار الجادين والمحلات',
    priceMonthly: 249,
    priceYearly: 2499,
    yearlyDiscount: '17٪ خصم',
    ctaLabel: 'اشترك في البرو',
    highlight: true,
    features: [
      { text: 'كل مميزات الأساسي', ok: true },
      { text: 'مساعد AI بلا حد', ok: true },
      { text: 'شيل شعار متجري', ok: true },
      { text: 'دومين مخصوص (قريبًا)', ok: true },
      { text: 'تقارير أرباح متقدمه', ok: true },
      { text: 'دعم فني على واتساب مباشره', ok: true },
      { text: 'حسابات موظفين (قريبًا)', ok: true },
    ],
  },
};

function getPlan(id) {
  return PLANS[id] || PLANS.trial;
}

function planName(id) {
  return (PLANS[id] || PLANS.trial).name;
}

function listPaidPlans() {
  return [PLANS.basic, PLANS.pro];
}

function allPlans() {
  return [PLANS.trial, PLANS.basic, PLANS.pro];
}

module.exports = { PLANS, getPlan, planName, listPaidPlans, allPlans };
