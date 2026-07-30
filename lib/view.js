// view.js — قوالب HTML بسيطة (بدون أي محرك قوالب خارجي)

const { listCategories, getCategoryConfig } = require('./category-configs');

// Categories the onboarding + settings UIs offer. Order matches importance/frequency.
const CATEGORIES = [
  ...listCategories(),
  { id: 'other', label: 'مجال تاني', emoji: '🛍️' },
];

// Suggested profit margin per category (kept for the products form default).
const CATEGORY_MARGIN = {
  kids: 80,
  men: 70,
  perfumes: 60,
  shoes: 70,
  'phone-accessories': 60,
  'women-accessories': 100,
  home: 50,
  packaging: 40,
  other: 50,
};

function suggestedMargin(category) {
  return CATEGORY_MARGIN[category] || 50;
}

function categoryLabel(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  return c ? `${c.emoji} ${c.label}` : 'متجر';
}

function categoryConfigFor(id) {
  return getCategoryConfig(id);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج.م';
}

function fmtDate(s) {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' });
  } catch (e) {
    return s;
  }
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'الرئيسية', key: 'home' },
  { href: '/dashboard/products', icon: '📦', label: 'المخزون', key: 'products' },
  { href: '/dashboard/sales', icon: '🧾', label: 'المبيعات', key: 'sales' },
  { href: '/dashboard/purchases', icon: '🛒', label: 'المشتريات', key: 'purchases' },
  { href: '/dashboard/cash', icon: '💰', label: 'الخزنة', key: 'cash' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'الإعدادات', key: 'settings' },
];

function bottomNav(activeKey) {
  return `
  <nav class="bottom-nav">
    ${NAV_ITEMS.map(
      (item) => `
      <a href="${item.href}" class="${item.key === activeKey ? 'active' : ''}">
        <span class="icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`
    ).join('')}
  </nav>`;
}

function topbar(merchant, subtitle) {
  return `
  <div class="topbar">
    <div class="brand">
      <span class="logo">🛍️</span>
      <div>
        <div>${esc(merchant ? merchant.store_name : 'متجري')}</div>
        ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ''}
      </div>
    </div>
  </div>`;
}

function page({ title, body, dir = 'rtl', bodyClass = '', extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4F46E5">
<title>${esc(title)} · متجري</title>
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/style.css">
${extraHead}
</head>
<body class="${bodyClass}">
${body}
<script src="/app.js"></script>
</body>
</html>`;
}

function dashboardPage({ title, merchant, activeKey, subtitle, body }) {
  return page({
    title,
    body: `
      ${topbar(merchant, subtitle)}
      <div class="container">
        ${body}
      </div>
      ${bottomNav(activeKey)}
    `,
  });
}

module.exports = { CATEGORIES, categoryLabel, categoryConfigFor, suggestedMargin, esc, money, fmtDate, bottomNav, topbar, page, dashboardPage };
