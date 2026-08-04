// lib/kids-landing.js — Laila Kids-style landing page for kids-clothes merchants.
// Uses merchant.store_name + products from DB; falls back to sensible defaults
// for fields not yet supported by the current schema (colors/sizes/sections/bundle pricing).

const { esc, jsonScriptSafe } = require('./view');

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

function renderKidsLanding(merchant, products, host) {
  const waNumber = normalizeWhatsApp(merchant.whatsapp);
  const storeName = merchant.store_name || 'متجر ملابس أطفال';
  // Open Graph preview (WhatsApp/Facebook link previews) needs an absolute
  // image URL. Prefer a real product photo (now hosted on Vercel Blob) when
  // one exists; fall back to the app icon for stores with no products yet,
  // or for older products still holding a base64 data URI (those can't be
  // used as an og:image — crawlers fetch a URL, not inline data).
  const firstRealPhoto = products.find((p) => p.image && /^https?:\/\//i.test(p.image));
  const ogImage = firstRealPhoto ? firstRealPhoto.image : (host ? `https://${host}/icons/icon-512.png` : '/icons/icon-512.png');
  const ogDescription = `اكتشفي مجموعة ${storeName} لملابس الأطفال، والدفع عند الاستلام لكل محافظات مصر`;

  // Prepare products for client JS
  function coerce(raw){ if(!raw) return {}; if(typeof raw==='string'){ try{return JSON.parse(raw)}catch(e){return {}} } return raw; }
  const merchantSections = coerce(merchant.sections);
  const sectionsList = Array.isArray(merchantSections) ? merchantSections : [];
  const jsProducts = products.map((p) => {
    const attrs = coerce(p.attributes);
    const stock = coerce(p.variant_stock);
    // Available sizes = sizes attribute filtered by stock > 0.
    const sizeList = Array.isArray(attrs.sizes) ? attrs.sizes : [];
    const availableSizes = Object.keys(stock).length
      ? sizeList.filter(s => (Number(stock[s]) || 0) > 0)
      : sizeList;
    const totalStock = Object.keys(stock).length
      ? Object.values(stock).reduce((a, b) => a + (Number(b) || 0), 0)
      : p.quantity;
    return {
      id: p.id,
      name: p.name,
      price: p.sell_price,
      image: p.image || '',
      description: p.description || '',
      quantity: totalStock,
      sizes: availableSizes,
      section: attrs._merchant_section || '',
    };
  });
  // Only show sections that actually have products.
  const usedSections = sectionsList.filter((s) => jsProducts.some((p) => p.section === s));

  const shippingZones = DEFAULT_SHIPPING_ZONES;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(storeName)} — كتالوج المنتجات</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(storeName)}">
<meta property="og:description" content="${esc(ogDescription)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --cream:#FBF3EC; --card:#FFFFFF; --blush:#F5CBD6; --rose:#D9647E;
    --rose-deep:#B84A64; --sage:#9FBF9A; --ink:#3C2E2E; --ink-soft:#7A6A68;
    --line:#EDE0D8; --radius:18px;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);font-family:'Cairo',sans-serif;color:var(--ink);padding-bottom:70px}
  h1,h2,h3{font-family:'Baloo 2',sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:0 18px}

  header{padding:16px 0;border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:20}
  .header-inner{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .logo{display:flex;align-items:center;gap:10px}
  .logo-mark{width:42px;height:42px;border-radius:50%;background:var(--blush);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px}
  .logo-text .name{font-size:18px;font-weight:700;color:var(--rose-deep)}
  .logo-text .tag{font-size:10.5px;color:var(--ink-soft)}
  .cart-btn{position:relative;background:var(--rose-deep);color:#fff;border:none;padding:10px 18px;border-radius:999px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px}
  .cart-count{background:#fff;color:var(--rose-deep);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}

  .top-note{text-align:center;font-size:13px;color:var(--rose-deep);background:var(--blush);padding:9px 10px;font-weight:600}

  .offer-banner{background:linear-gradient(90deg,var(--rose-deep),var(--rose));color:#fff;border-radius:20px;padding:22px 26px;margin:24px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
  .offer-banner h2{margin:0 0 4px;font-size:20px}
  .offer-banner p{margin:0;font-size:13.5px;opacity:.92}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px;margin-bottom:40px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;transition:transform .15s,box-shadow .15s}
  .card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(60,46,46,.10)}
  .card-img{width:100%;aspect-ratio:1/1;background:var(--blush) center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-size:52px;color:#fff}
  .card-body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}
  .card-body h3{font-size:15px;margin:0;color:var(--ink);line-height:1.4}
  .card-desc{font-size:12px;color:var(--ink-soft);line-height:1.5;min-height:18px}
  .card-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .card-price .new{font-size:19px;font-weight:800;color:var(--rose-deep);line-height:1}
  .card-price .new small{font-size:12px;font-weight:600;margin-inline-start:2px}
  .add-btn{margin-top:auto;background:var(--rose-deep);color:#fff;border:none;padding:10px;border-radius:10px;font-family:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
  .add-btn:hover{background:var(--rose)}
  .add-btn.added{background:var(--sage)}
  .card-badge{background:#C0392B;color:#fff;font-weight:700;font-size:11.5px;padding:4px 9px;border-radius:8px;text-align:center;align-self:flex-start}

  .empty-state{text-align:center;padding:60px 20px;color:var(--ink-soft)}
  .empty-state .big{font-size:52px;margin-bottom:10px}

  .overlay{position:fixed;inset:0;background:rgba(60,46,46,.45);display:none;z-index:40}
  .overlay.open{display:block}
  .drawer{position:fixed;top:0;left:-100%;height:100%;width:100%;max-width:100%;background:var(--cream);z-index:50;transition:left .25s ease;overflow-y:auto;box-shadow:12px 0 30px rgba(0,0,0,.15)}
  .drawer.open{left:0}
  .drawer-head{position:sticky;top:0;z-index:2;padding:18px 20px;background:var(--card);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
  .drawer-head h2{margin:0;font-size:18px}
  .close-btn{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft)}
  .drawer-body{padding:16px 20px;max-width:600px;margin:0 auto}
  .empty-cart{text-align:center;color:var(--ink-soft);font-size:14px;padding:40px 10px}

  .cart-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
  .cart-item img{width:88px;height:88px;border-radius:12px;object-fit:cover;background:var(--blush)}
  .cart-item .noimg{width:88px;height:88px;border-radius:12px;background:var(--blush);display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}
  .cart-item-info{flex:1}
  .cart-item-info .n{font-size:15.5px;font-weight:700}
  .cart-item-info .s{font-size:13px;color:var(--ink-soft);margin-top:2px}
  .qty-ctrl{display:flex;align-items:center;gap:8px;margin-top:6px}
  .qty-ctrl button{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:#fff;cursor:pointer;font-weight:700;font-size:15px;color:var(--rose-deep)}
  .remove-btn{background:none;border:none;color:var(--rose-deep);font-size:12px;cursor:pointer;text-decoration:underline;margin-top:4px}

  .summary-box{background:var(--card);border-radius:14px;padding:14px 16px;margin-top:14px;border:1px solid var(--line)}
  .summary-row{display:flex;justify-content:space-between;font-size:15px;margin-bottom:9px;color:var(--ink-soft)}
  .summary-row.total{font-weight:800;color:var(--ink);font-size:18px;border-top:1px dashed var(--line);padding-top:10px;margin-top:6px}

  .drawer-foot{padding:16px 20px;background:var(--card);border-top:1px solid var(--line)}
  .drawer-foot .field,.drawer-foot .checkout-btn,.drawer-foot .error-msg{max-width:600px;margin-left:auto;margin-right:auto}
  .field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
  .field label{font-size:12.5px;font-weight:700}
  .field input,.field select,.field textarea{border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:var(--cream);color:var(--ink)}
  .field textarea{min-height:60px;resize:vertical}
  .checkout-btn{width:100%;background:var(--rose-deep);color:#fff;border:none;padding:14px;border-radius:12px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .checkout-btn:hover{background:var(--rose)}
  .error-msg{color:var(--rose-deep);font-size:12.5px;font-weight:700;text-align:center;margin-top:8px;display:none}

  #governorate{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:100%;box-sizing:border-box;border:1.5px solid var(--line);border-radius:14px;padding:14px 18px 14px 46px;font-family:inherit;font-size:15px;font-weight:600;color:var(--ink);background-color:#fff;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23B84A64' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 16px center;background-size:18px;cursor:pointer}

  footer{text-align:center;padding:20px;color:var(--ink-soft);font-size:13px}
  footer .brand{color:var(--rose-deep);font-weight:700}
</style>
</head>
<body>

<div class="top-note">🚚 التوصيل لكل محافظات مصر | الدفع عند الاستلام</div>

<header>
  <div class="wrap header-inner">
    <div class="logo">
      <div class="logo-mark">👶</div>
      <div class="logo-text">
        <div class="name">${esc(storeName)}</div>
        <div class="tag">ملابس أطفال بحب 🎀</div>
      </div>
    </div>
    <button class="cart-btn" onclick="openCart()">
      🛍️ السلة <span class="cart-count" id="cartCount">0</span>
    </button>
  </div>
</header>

<main class="wrap">
  <div class="offer-banner">
    <div>
      <h2>أهلاً بيكي في ${esc(storeName)}</h2>
      <p>اختاري لطفلك من مجموعتنا، والدفع عند الاستلام لكل محافظات مصر</p>
    </div>
  </div>

  ${usedSections.length > 0 ? `
  <div class="filters" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
    <button class="filter-chip active" data-filter="__all" style="padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:var(--rose-deep);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">الكل</button>
    ${usedSections.map((s) => `
      <button class="filter-chip" data-filter="${esc(s)}" style="padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:var(--ink);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">${esc(s)}</button>
    `).join('')}
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

<footer>صنعت بحب لأمهات مصر 🎀 <span class="brand">${esc(storeName)}</span></footer>

<div class="overlay" id="overlay" onclick="closeCart()"></div>
<div class="drawer" id="drawer">
  <div class="drawer-head">
    <h2>سلة الطلب</h2>
    <button class="close-btn" onclick="closeCart()">✕</button>
  </div>
  <div class="drawer-body">
    <div id="cartItemsWrap"><div class="empty-cart">السلة فاضية — ابدئي تختاري ✨</div></div>
    <div class="summary-box" id="summaryBox" style="display:none">
      <div class="summary-row"><span>عدد القطع</span><span id="sumQty">0</span></div>
      <div class="summary-row"><span>سعر المنتجات</span><span id="sumSubtotal">0 ج.م</span></div>
      <div class="summary-row"><span>الشحن</span><span id="sumShipping">— اختاري المحافظة</span></div>
      <div class="summary-row total"><span>الإجمالي</span><span id="sumTotal">0 ج.م</span></div>
    </div>
  </div>
  <div class="drawer-foot">
    <div class="field">
      <label>المحافظة</label>
      <select id="governorate" onchange="renderSummary()">
        <option value="">اختاري محافظتك</option>
      </select>
    </div>
    <div class="field"><label>الاسم</label><input type="text" id="custName" placeholder="اسمك"></div>
    <div class="field"><label>رقم الموبايل</label><input type="tel" id="custPhone" placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>العنوان بالتفصيل</label><input type="text" id="custAddress" placeholder="المنطقة والشارع"></div>
    <div class="field"><label>ملاحظات (اختياري)</label><textarea id="custNotes"></textarea></div>
    <button class="checkout-btn" onclick="submitOrder()">إتمام الشراء</button>
    <div class="error-msg" id="errorMsg">من فضلك املي كل البيانات والسلة متكونش فاضية</div>
  </div>
</div>

<script>
const PRODUCTS = ${jsonScriptSafe(jsProducts)};
const SHIPPING_ZONES = ${jsonScriptSafe(shippingZones)};
const WHATSAPP_NUMBER = ${jsonScriptSafe(waNumber)};
const STORE_NAME = ${jsonScriptSafe(storeName)};

let cart = [];
let activeSection = '__all';

function money(n){ return Number(n).toLocaleString('ar-EG') + ' ج.م'; }

// Escape any text coming from the database (product name/description/image/size)
// before it's injected into innerHTML — prevents a malicious product name or
// attribute value from running as script in a customer's browser.
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderProducts(){
  const grid = document.getElementById('productGrid');
  if (PRODUCTS.length === 0) return;
  const list = activeSection === '__all' ? PRODUCTS : PRODUCTS.filter(p => p.section === activeSection);
  if (list.length === 0){
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="big">🔍</div><div style="font-size:15px;font-weight:600">مفيش منتجات في القسم ده لسه</div></div>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const soldOut = p.quantity <= 0 || (p.sizes && p.sizes.length === 0);
    return \`
    <div class="card">
      <div class="card-img" style="\${p.image ? \`background-image:url('\${esc(p.image)}')\` : ''}">\${p.image ? '' : '🛍️'}</div>
      <div class="card-body">
        \${soldOut ? '<div class="card-badge">نفدت الكميه</div>' : ''}
        <h3>\${esc(p.name)}</h3>
        <div class="card-desc">\${p.description ? esc(p.description.slice(0,80)) : ''}</div>
        \${!soldOut && p.sizes && p.sizes.length ? \`
          <select class="size-select" id="sz-\${p.id}" style="border:1.5px solid var(--line);border-radius:10px;padding:8px 10px;font-family:inherit;font-size:13px;background:var(--cream);color:var(--ink);">
            <option value="">اختاري المقاس</option>
            \${p.sizes.map(s => '<option value="'+esc(s)+'">'+esc(s)+'</option>').join('')}
          </select>
        \` : ''}
        <div class="card-price"><span class="new">\${Number(p.price).toLocaleString('ar-EG')}<small>ج.م</small></span></div>
        \${soldOut
          ? '<button class="add-btn" disabled style="background:#ccc;cursor:not-allowed">نفدت الكميه</button>'
          : \`<button class="add-btn" id="add-\${p.id}" onclick="addToCart(\${p.id})">🛒 أضيفي للسله</button>\`}
      </div>
    </div>\`;
  }).join('');
}

function addToCart(pid){
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const sizeSel = document.getElementById('sz-'+pid);
  const size = sizeSel ? sizeSel.value : '';
  if (sizeSel && p.sizes && p.sizes.length && !size){
    sizeSel.style.borderColor = 'var(--rose-deep)';
    return;
  }
  const key = pid + '|' + size;
  const existing = cart.find(c => c.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, id: p.id, name: p.name, image: p.image, price: p.price, size, qty: 1 });
  updateCart();
  const btn = document.getElementById('add-'+pid);
  if (btn){ btn.classList.add('added'); btn.textContent='✓ في السله'; setTimeout(()=>{btn.classList.remove('added'); btn.textContent='🛒 أضيفي للسله';}, 1200); }
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
    wrap.innerHTML = '<div class="empty-cart">السلة فاضية — ابدئي تختاري ✨</div>';
    summaryBox.style.display = 'none';
    return;
  }
  wrap.innerHTML = cart.map(c => \`
    <div class="cart-item">
      \${c.image ? \`<img src="\${esc(c.image)}">\` : '<div class="noimg">🛍️</div>'}
      <div class="cart-item-info">
        <div class="n">\${esc(c.name)}</div>
        <div class="s">\${money(c.price)}</div>
        \${c.size ? '<div style="font-size:12px;color:var(--rose-deep);margin-top:3px;font-weight:600;">'+esc(c.size)+'</div>' : ''}
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
  document.getElementById('sumShipping').textContent = shipping !== null ? money(shipping) : '— اختاري المحافظة';
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
    '🛍️ طلب جديد من ' + STORE_NAME,
    '',
    '👤 الاسم: ' + name,
    '📱 الموبايل: ' + phone,
    '📍 المحافظة: ' + gov.name,
    '🏠 العنوان: ' + addr,
    (notes ? '📝 ملاحظات: ' + notes : ''),
    '',
    '🛒 الطلب:',
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
renderProducts();
updateCart();

// Wire up filter chips
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    activeSection = chip.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.remove('active');
      c.style.background = '#fff';
      c.style.color = 'var(--ink)';
    });
    chip.classList.add('active');
    chip.style.background = 'var(--rose-deep)';
    chip.style.color = '#fff';
    renderProducts();
  });
});
</script>
</body>
</html>`;
}

module.exports = { renderKidsLanding };
