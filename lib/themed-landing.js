// themed-landing.js — public storefront for any category driven by its
// category-config theme + attributes. Kids clothing uses the dedicated
// lib/kids-landing.js file instead (Laila-style, richer).
//
// UX per category:
//   - hero banner using theme colors + copy from the config
//   - filter chips built from the config's filterKey (unique values across products)
//   - product cards showing image, name, description, price, add-to-cart
//   - product attributes (sizes / volumes / models etc.) shown on each card
//   - cart drawer + checkout form (governorate select + WhatsApp submit)

const { esc } = require('./view');
const { getCategoryConfig } = require('./category-configs');

const DEFAULT_SHIPPING_ZONES = [
  { name: 'القاهرة والجيزة (والمدن الجديدة والتجمعات)', price: 75 },
  { name: 'أطراف القاهرة والجيزة (بدر، الحوامدية، أوسيم، أطفيح...)', price: 80 },
  { name: 'الإسكندرية', price: 90 },
  { name: 'أطراف الإسكندرية (برج العرب، العجمي، العامرية...)', price: 95 },
  { name: 'مدن الدلتا (الدقهلية، الغربية، المنوفية، الشرقية، كفر الشيخ، البحيرة، القليوبية)', price: 90 },
  { name: 'الإسماعيلية', price: 95 },
  { name: 'بورسعيد', price: 95 },
  { name: 'السويس', price: 95 },
  { name: 'بني سويف، الفيوم، المنيا', price: 100 },
  { name: 'أسيوط، سوهاج، الأقصر، أسوان، قنا', price: 115 },
  { name: 'البحر الأحمر، الساحل الشمالي، مطروح، العين السخنة', price: 120 },
  { name: 'شرم الشيخ، سيناء، الوادي الجديد، مرسى علم، القصير', price: 175 },
];

function normalizeWhatsApp(raw) {
  const wa = (raw || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  if (wa.startsWith('20')) return wa;
  if (wa.startsWith('0')) return `2${wa}`;
  return `20${wa}`;
}

function coerceAttrs(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }
  return raw;
}

// Compute filter chips from products' attribute values under filterKey.
function buildFilters(products, filterKey) {
  if (!filterKey) return [];
  const set = new Set();
  for (const p of products) {
    const v = p.attributes ? p.attributes[filterKey] : null;
    if (!v) continue;
    if (Array.isArray(v)) v.forEach((x) => set.add(x));
    else set.add(v);
  }
  return Array.from(set);
}

function renderThemedLanding(merchant, rawProducts) {
  const cfg = getCategoryConfig(merchant.category);
  if (!cfg) {
    return `<!doctype html><meta charset="utf-8"><h1 style="text-align:center;padding:40px;font-family:sans-serif;">المتجر متاح قريبًا</h1>`;
  }

  const products = rawProducts.map((p) => ({
    ...p,
    attributes: coerceAttrs(p.attributes),
    variant_stock: coerceAttrs(p.variant_stock),
  }));
  const waNumber = normalizeWhatsApp(merchant.whatsapp);
  const storeName = merchant.store_name || cfg.label;
  const theme = cfg.theme;
  const heroTitle = theme.hero.title.replace('{store_name}', storeName);
  const heroSubtitle = theme.hero.subtitle;
  // Category-defined filters + merchant-defined custom sections (from settings).
  const catFilters = buildFilters(products, cfg.filterKey);
  const merchantSections = coerceAttrs(merchant.sections);
  const customFilters = Array.isArray(merchantSections)
    ? merchantSections.filter((s) => products.some((p) => (p.attributes || {})._merchant_section === s))
    : [];
  const filters = [...catFilters, ...customFilters];

  // What to expose to client-side JS.
  const jsProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.sell_price,
    image: p.image || '',
    description: p.description || '',
    quantity: p.quantity,
    attributes: p.attributes,
    variant_stock: p.variant_stock || {},
  }));

  const jsConfig = {
    filterKey: cfg.filterKey,
    stockKey: cfg.stockKey || null,
    sizeLabel: cfg.sizeLabel,
    attributes: cfg.attributes.map((a) => ({ key: a.key, label: a.label, type: a.type })),
    customSections: customFilters,
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(storeName)} — ${esc(cfg.label)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --primary:${theme.palette.primary};
    --accent:${theme.palette.accent};
    --soft:${theme.palette.soft};
    --bg:${theme.palette.bg};
    --ink:#222;
    --ink-soft:#666;
    --line:#e8e0d5;
    --card:#fff;
    --radius:16px;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);font-family:'Cairo',sans-serif;color:var(--ink);padding-bottom:60px}
  .wrap{max-width:1120px;margin:0 auto;padding:0 18px}

  .top-note{text-align:center;font-size:13px;color:var(--primary);background:var(--soft);padding:9px 10px;font-weight:600}

  header{padding:16px 0;border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:20}
  .header-inner{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .logo{display:flex;align-items:center;gap:10px}
  .logo-mark{width:44px;height:44px;border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px}
  .logo-text .name{font-size:18px;font-weight:800;color:var(--primary)}
  .logo-text .tag{font-size:11px;color:var(--ink-soft);margin-top:2px}
  .cart-btn{background:var(--primary);color:#fff;border:none;padding:10px 18px;border-radius:999px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px}
  .cart-count{background:#fff;color:var(--primary);border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}

  .hero{background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;border-radius:20px;padding:26px 28px;margin:24px 0}
  .hero h1{margin:0 0 6px;font-size:22px;font-weight:800}
  .hero p{margin:0;font-size:14px;opacity:.92;line-height:1.6}

  .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
  .filter-chip{padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;color:var(--ink)}
  .filter-chip.active{background:var(--primary);border-color:var(--primary);color:#fff}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;margin-bottom:40px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
  .card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.08)}
  .card-img{width:100%;aspect-ratio:1/1;background:var(--soft) center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:44px;color:#fff}
  .card-body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
  .card-body h3{font-size:15px;margin:0;color:var(--ink);line-height:1.4;font-weight:700}
  .card-desc{font-size:12px;color:var(--ink-soft);line-height:1.5;min-height:18px}
  .card-attrs{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
  .attr-badge{background:var(--soft);color:var(--primary);font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px}
  .card-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:2px}
  .card-price .new{font-size:19px;font-weight:800;color:var(--primary);line-height:1}
  .card-price .new small{font-size:12px;font-weight:600;margin-inline-start:2px}
  .size-select{border:1.5px solid var(--line);border-radius:10px;padding:8px 10px;font-family:inherit;font-size:13px;background:var(--bg);color:var(--ink);width:100%}
  .add-btn{margin-top:auto;background:var(--primary);color:#fff;border:none;padding:11px;border-radius:10px;font-family:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
  .add-btn:hover{background:var(--accent)}
  .add-btn.added{background:#3d9b6f}
  .card-badge{background:#C0392B;color:#fff;font-weight:700;font-size:11.5px;padding:4px 9px;border-radius:8px;align-self:flex-start}

  .empty-state{text-align:center;padding:60px 20px;color:var(--ink-soft)}
  .empty-state .big{font-size:52px;margin-bottom:10px}

  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:40}
  .overlay.open{display:block}
  .drawer{position:fixed;top:0;left:-100%;height:100%;width:100%;max-width:100%;background:var(--bg);z-index:50;transition:left .25s ease;overflow-y:auto;box-shadow:12px 0 30px rgba(0,0,0,.15)}
  .drawer.open{left:0}
  .drawer-head{position:sticky;top:0;z-index:2;padding:18px 20px;background:var(--card);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
  .drawer-head h2{margin:0;font-size:18px}
  .close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft)}
  .drawer-body{padding:16px 20px;max-width:640px;margin:0 auto}
  .empty-cart{text-align:center;color:var(--ink-soft);font-size:14px;padding:40px 10px}

  .cart-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
  .cart-item img{width:88px;height:88px;border-radius:12px;object-fit:cover;background:var(--soft)}
  .cart-item .noimg{width:88px;height:88px;border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}
  .cart-item-info{flex:1}
  .cart-item-info .n{font-size:15.5px;font-weight:700}
  .cart-item-info .s{font-size:13px;color:var(--ink-soft);margin-top:2px}
  .cart-item-info .variant{font-size:12px;color:var(--primary);margin-top:3px;font-weight:600}
  .qty-ctrl{display:flex;align-items:center;gap:8px;margin-top:6px}
  .qty-ctrl button{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:#fff;cursor:pointer;font-weight:700;font-size:15px;color:var(--primary)}
  .remove-btn{background:none;border:none;color:var(--primary);font-size:12px;cursor:pointer;text-decoration:underline;margin-top:4px}

  .summary-box{background:var(--card);border-radius:14px;padding:14px 16px;margin-top:14px;border:1px solid var(--line)}
  .summary-row{display:flex;justify-content:space-between;font-size:15px;margin-bottom:9px;color:var(--ink-soft)}
  .summary-row.total{font-weight:800;color:var(--ink);font-size:18px;border-top:1px dashed var(--line);padding-top:10px;margin-top:6px}

  .drawer-foot{padding:16px 20px;background:var(--card);border-top:1px solid var(--line)}
  .drawer-foot .field,.drawer-foot .checkout-btn,.drawer-foot .error-msg{max-width:640px;margin-left:auto;margin-right:auto}
  .field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
  .field label{font-size:12.5px;font-weight:700}
  .field input,.field select,.field textarea{border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:var(--bg);color:var(--ink)}
  .field textarea{min-height:60px;resize:vertical}
  .checkout-btn{width:100%;background:var(--primary);color:#fff;border:none;padding:14px;border-radius:12px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .checkout-btn:hover{background:var(--accent)}
  .error-msg{color:var(--primary);font-size:12.5px;font-weight:700;text-align:center;margin-top:8px;display:none}

  footer{text-align:center;padding:20px;color:var(--ink-soft);font-size:13px}
  footer .brand{color:var(--primary);font-weight:800}
</style>
</head>
<body>

<div class="top-note">🚚 التوصيل لكل محافظات مصر | الدفع عند الاستلام</div>

<header>
  <div class="wrap header-inner">
    <div class="logo">
      <div class="logo-mark">${theme.hero.logo}</div>
      <div class="logo-text">
        <div class="name">${esc(storeName)}</div>
        <div class="tag">${esc(theme.hero.tag)}</div>
      </div>
    </div>
    <button class="cart-btn" onclick="openCart()">
      🛒 السلة <span class="cart-count" id="cartCount">0</span>
    </button>
  </div>
</header>

<main class="wrap">
  <div class="hero">
    <h1>${esc(heroTitle)}</h1>
    <p>${esc(heroSubtitle)}</p>
  </div>

  ${filters.length > 1 ? `
  <div class="filters" id="filters">
    <button class="filter-chip active" data-filter="__all">الكل</button>
    ${filters.map((f) => `<button class="filter-chip" data-filter="${esc(f)}">${esc(f)}</button>`).join('')}
  </div>
  ` : ''}

  <div class="grid" id="productGrid">
    ${products.length === 0 ? `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="big">🛍️</div>
        <div style="font-size:15px;font-weight:600">لسه مفيش منتجات، تابعنا قريب</div>
      </div>
    ` : ''}
  </div>
</main>

<footer>صفحه بيع مقدمه من <span class="brand">${esc(storeName)}</span> · مدعومه بواسطه متجري</footer>

<div class="overlay" id="overlay" onclick="closeCart()"></div>
<div class="drawer" id="drawer">
  <div class="drawer-head">
    <h2>سلة الطلب</h2>
    <button class="close-btn" onclick="closeCart()">✕</button>
  </div>
  <div class="drawer-body">
    <div id="cartItemsWrap"><div class="empty-cart">السلة فاضية — ابدأ اختار المنتجات ✨</div></div>
    <div class="summary-box" id="summaryBox" style="display:none">
      <div class="summary-row"><span>عدد القطع</span><span id="sumQty">0</span></div>
      <div class="summary-row"><span>سعر المنتجات</span><span id="sumSubtotal">0 ج.م</span></div>
      <div class="summary-row"><span>الشحن</span><span id="sumShipping">— اختار المحافظه</span></div>
      <div class="summary-row total"><span>الإجمالي</span><span id="sumTotal">0 ج.م</span></div>
    </div>
  </div>
  <div class="drawer-foot">
    <div class="field">
      <label>المحافظة</label>
      <select id="governorate" onchange="renderSummary()">
        <option value="">اختار محافظتك</option>
      </select>
    </div>
    <div class="field"><label>الاسم</label><input type="text" id="custName" placeholder="اسمك"></div>
    <div class="field"><label>رقم الموبايل</label><input type="tel" id="custPhone" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>العنوان بالتفصيل</label><input type="text" id="custAddress" placeholder="المنطقة والشارع"></div>
    <div class="field"><label>ملاحظات (اختياري)</label><textarea id="custNotes"></textarea></div>
    <button class="checkout-btn" onclick="submitOrder()">إتمام الشراء</button>
    <div class="error-msg" id="errorMsg">من فضلك املأ كل البيانات والسلة متكونش فاضيه</div>
  </div>
</div>

<script>
const PRODUCTS = ${JSON.stringify(jsProducts)};
const CONFIG = ${JSON.stringify(jsConfig)};
const SHIPPING_ZONES = ${JSON.stringify(DEFAULT_SHIPPING_ZONES)};
const WHATSAPP_NUMBER = ${JSON.stringify(waNumber)};
const STORE_NAME = ${JSON.stringify(storeName)};

let cart = [];
let activeFilter = '__all';

function money(n){ return Number(n).toLocaleString('ar-EG') + ' ج.م'; }

function matchesFilter(p){
  if (activeFilter === '__all') return true;
  const attrs = p.attributes || {};
  // Merchant-defined custom section chip wins if it matches.
  if (CONFIG.customSections && CONFIG.customSections.includes(activeFilter)){
    return attrs._merchant_section === activeFilter;
  }
  if (!CONFIG.filterKey) return true;
  const v = attrs[CONFIG.filterKey];
  if (!v) return false;
  if (Array.isArray(v)) return v.includes(activeFilter);
  return v === activeFilter;
}

function attrBadges(p){
  const attrs = p.attributes || {};
  const out = [];
  for (const a of CONFIG.attributes){
    if (a.key === CONFIG.filterKey) continue;
    const v = attrs[a.key];
    if (!v) continue;
    if (a.type === 'multi' && Array.isArray(v) && v.length){
      out.push(a.label + ': ' + v.slice(0, 3).join('، '));
    } else if (a.type !== 'multi'){
      out.push(a.label + ': ' + v);
    }
  }
  return out.slice(0, 3);
}

function sizeOptions(p){
  // Prefer the stock-tracked attribute; fall back to first multi attribute.
  const attrs = p.attributes || {};
  const stock = p.variant_stock || {};
  const preferredKey = CONFIG.stockKey;
  if (preferredKey && Array.isArray(attrs[preferredKey])){
    // Only show variants with stock > 0.
    const values = attrs[preferredKey].filter(v => (Number(stock[v]) || 0) > 0);
    if (values.length) return { key: preferredKey, values };
    return null;
  }
  for (const a of CONFIG.attributes){
    if (a.type !== 'multi') continue;
    if (a.key === CONFIG.filterKey) continue;
    const v = attrs[a.key];
    if (Array.isArray(v) && v.length) return { key: a.key, values: v };
  }
  return null;
}

function productAvailable(p){
  // If the category tracks per-variant stock: available iff any variant has stock.
  if (CONFIG.stockKey){
    const stock = p.variant_stock || {};
    return Object.values(stock).some(n => (Number(n) || 0) > 0);
  }
  return p.quantity > 0;
}

function renderProducts(){
  const grid = document.getElementById('productGrid');
  const list = PRODUCTS.filter(matchesFilter);
  if (list.length === 0){
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="big">🔎</div><div style="font-size:15px;font-weight:600">مفيش منتجات في القسم ده</div></div>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const available = productAvailable(p);
    const size = available ? sizeOptions(p) : null;
    return \`
    <div class="card">
      <div class="card-img" style="\${p.image ? \`background-image:url('\${p.image}')\` : ''}">\${p.image ? '' : '🛍️'}</div>
      <div class="card-body">
        \${!available ? '<div class="card-badge">نفدت الكميه</div>' : ''}
        <h3>\${p.name}</h3>
        <div class="card-desc">\${p.description ? p.description.slice(0,80) : ''}</div>
        <div class="card-attrs">\${attrBadges(p).map(b => '<span class="attr-badge">'+b+'</span>').join('')}</div>
        \${size ? \`<select class="size-select" id="sz-\${p.id}"><option value="">\${CONFIG.sizeLabel}</option>\${size.values.map(v => '<option value="'+v+'">'+v+'</option>').join('')}</select>\` : ''}
        <div class="card-price"><span class="new">\${Number(p.price).toLocaleString('ar-EG')}<small>ج.م</small></span></div>
        \${!available
          ? '<button class="add-btn" disabled style="background:#ccc;cursor:not-allowed">نفدت الكميه</button>'
          : \`<button class="add-btn" id="add-\${p.id}" onclick="addToCart(\${p.id})">🛒 أضف للسله</button>\`}
      </div>
    </div>\`;
  }).join('');
}

function addToCart(pid){
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const sizeSel = document.getElementById('sz-'+pid);
  const size = sizeSel ? sizeSel.value : '';
  if (sizeSel && !size){
    sizeSel.style.borderColor = 'var(--primary)';
    return;
  }
  const key = pid + '|' + size;
  const existing = cart.find(c => c.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, id: p.id, name: p.name, image: p.image, price: p.price, size, qty: 1 });
  updateCart();
  const btn = document.getElementById('add-'+pid);
  if (btn){ btn.classList.add('added'); btn.textContent='✓ اتضاف'; setTimeout(()=>{btn.classList.remove('added'); btn.textContent='🛒 أضف للسلة';}, 1200); }
}

function changeQty(key, delta){
  const item = cart.find(c => c.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.key !== key);
  updateCart();
}
function removeFromCart(key){ cart = cart.filter(c => c.key !== key); updateCart(); }

function updateCart(){
  document.getElementById('cartCount').textContent = cart.reduce((s,c) => s + c.qty, 0);
  const wrap = document.getElementById('cartItemsWrap');
  const summaryBox = document.getElementById('summaryBox');
  if (cart.length === 0){
    wrap.innerHTML = '<div class="empty-cart">السلة فاضية — ابدأ اختار المنتجات ✨</div>';
    summaryBox.style.display = 'none';
    return;
  }
  wrap.innerHTML = cart.map(c => \`
    <div class="cart-item">
      \${c.image ? \`<img src="\${c.image}">\` : '<div class="noimg">🛍️</div>'}
      <div class="cart-item-info">
        <div class="n">\${c.name}</div>
        <div class="s">\${money(c.price)}</div>
        \${c.size ? '<div class="variant">'+c.size+'</div>' : ''}
        <div class="qty-ctrl">
          <button onclick="changeQty('\${c.key}',-1)">−</button>
          <span>\${c.qty}</span>
          <button onclick="changeQty('\${c.key}',1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('\${c.key}')">حذف</button>
      </div>
    </div>
  \`).join('');
  summaryBox.style.display = '';
  renderSummary();
}

function renderSummary(){
  const qty = cart.reduce((s,c) => s + c.qty, 0);
  const subtotal = cart.reduce((s,c) => s + c.qty * c.price, 0);
  const govIdx = document.getElementById('governorate').value;
  const shipping = govIdx !== '' ? SHIPPING_ZONES[Number(govIdx)].price : null;
  document.getElementById('sumQty').textContent = qty;
  document.getElementById('sumSubtotal').textContent = money(subtotal);
  document.getElementById('sumShipping').textContent = shipping !== null ? money(shipping) : '— اختار المحافظه';
  document.getElementById('sumTotal').textContent = money(subtotal + (shipping || 0));
}

function openCart(){ document.getElementById('drawer').classList.add('open'); document.getElementById('overlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); document.body.style.overflow=''; }

function initGovernorates(){
  const sel = document.getElementById('governorate');
  SHIPPING_ZONES.forEach((z, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = z.name + ' — ' + z.price + ' ج.م';
    sel.appendChild(opt);
  });
}

function initFilters(){
  const chips = document.querySelectorAll('#filters .filter-chip');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    activeFilter = c.dataset.filter;
    renderProducts();
  }));
}

function submitOrder(){
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const addr = document.getElementById('custAddress').value.trim();
  const notes = document.getElementById('custNotes').value.trim();
  const govIdx = document.getElementById('governorate').value;
  const err = document.getElementById('errorMsg');
  if (cart.length === 0 || !name || !phone || !addr || govIdx === ''){
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  const gov = SHIPPING_ZONES[Number(govIdx)];
  const subtotal = cart.reduce((s,c) => s + c.qty * c.price, 0);
  const total = subtotal + gov.price;
  const lines = [
    '🛒 طلب جديد من ' + STORE_NAME,
    '',
    '👤 الاسم: ' + name,
    '📱 الموبايل: ' + phone,
    '📍 المحافظة: ' + gov.name,
    '🏠 العنوان: ' + addr,
    (notes ? '📝 ملاحظات: ' + notes : ''),
    '',
    '📦 الطلب:',
    ...cart.map(c => \`  • \${c.name}\${c.size ? ' ('+c.size+')' : ''} × \${c.qty} = \${money(c.qty * c.price)}\`),
    '',
    'إجمالي المنتجات: ' + money(subtotal),
    'الشحن: ' + money(gov.price),
    '💰 الإجمالي: ' + money(total),
  ].filter(Boolean).join('\\n');

  if (!WHATSAPP_NUMBER){
    alert('صاحب المتجر ملوش رقم واتساب متسجّل. الطلب:\\n\\n' + lines);
    return;
  }
  const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines);
  window.open(url, '_blank');
}

initGovernorates();
initFilters();
renderProducts();
updateCart();
</script>
</body>
</html>`;
}

module.exports = { renderThemedLanding };
