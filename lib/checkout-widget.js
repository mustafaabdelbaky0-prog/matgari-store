// checkout-widget.js — HTML+CSS+JS snippet for the storefront checkout modal.
// Storefront pages call renderCheckoutWidget(merchant) once and, per product,
// use the `onclick="openCheckout(...)"` handler with product data.
//
// The widget builds a cart of one line (single-product order), collects
// customer details, and POSTs to /store/:slug/order.

function renderCheckoutWidget(merchant) {
  const govs = [
    'القاهرة','الجيزة','الإسكندرية','الدقهلية','الشرقية','القليوبية','كفر الشيخ',
    'الغربية','المنوفية','البحيرة','دمياط','بورسعيد','الإسماعيلية','السويس',
    'شمال سيناء','جنوب سيناء','بني سويف','الفيوم','المنيا','أسيوط','سوهاج',
    'قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح',
  ];
  return `
  <style>
    .ck-backdrop{display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;backdrop-filter:blur(4px)}
    .ck-modal{display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;padding:20px}
    .ck-modal.open,.ck-backdrop.open{display:flex}
    .ck-modal.open{display:flex}
    .ck-box{background:#fff;border-radius:20px;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.2);position:relative}
    .ck-close{position:absolute;top:14px;left:14px;background:#f1f5f9;border:none;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-weight:700;color:#334155}
    .ck-title{margin:0 0 4px;font-size:20px;font-weight:800;color:#0F172A}
    .ck-sub{margin:0 0 18px;color:#64748B;font-size:13.5px}
    .ck-line{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
    .ck-line .np{font-weight:700;font-size:14.5px;color:#0F172A}
    .ck-line .np .var{font-size:12px;color:#64748B;font-weight:600}
    .ck-line .qc{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:4px}
    .ck-line .qc button{background:#f1f5f9;border:none;width:26px;height:26px;border-radius:6px;font-weight:800;cursor:pointer;font-size:14px}
    .ck-line .qc input{width:36px;border:none;text-align:center;font-family:inherit;font-weight:700}
    .ck-total{display:flex;justify-content:space-between;font-weight:800;font-size:16px;background:linear-gradient(135deg,#EEF2FF,#FCE7F3);padding:12px 14px;border-radius:12px;margin-bottom:18px}
    .ck-total .val{color:#4F46E5;font-size:20px}
    .ck-form label{display:block;font-size:13px;font-weight:700;color:#334155;margin:10px 0 5px}
    .ck-form input,.ck-form select,.ck-form textarea{width:100%;padding:11px 13px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:inherit;font-size:14.5px;background:#fff;color:#0F172A;box-sizing:border-box}
    .ck-form input:focus,.ck-form select:focus,.ck-form textarea:focus{outline:none;border-color:#4F46E5;box-shadow:0 0 0 3px rgba(79,70,229,.15)}
    .ck-form textarea{resize:vertical;min-height:60px}
    .ck-submit{width:100%;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border:none;padding:14px;border-radius:12px;font-family:inherit;font-weight:800;font-size:15.5px;cursor:pointer;margin-top:16px;box-shadow:0 8px 20px rgba(79,70,229,.25)}
    .ck-submit:hover{filter:brightness(1.05)}
    .ck-submit:disabled{opacity:.6;cursor:not-allowed}
    .ck-err{background:#FEE2E2;color:#991B1B;padding:10px 12px;border-radius:8px;font-size:13.5px;margin-top:10px}
  </style>

  <div class="ck-backdrop" id="ckBd" onclick="closeCheckout()"></div>
  <div class="ck-modal" id="ckMd">
    <div class="ck-box">
      <button class="ck-close" type="button" onclick="closeCheckout()">✕</button>
      <h2 class="ck-title">تفاصيل الطلب</h2>
      <p class="ck-sub">اكتب بياناتك عشان ${escapeHtml(merchant.store_name)} يقدر يوصلك الطلب</p>

      <div class="ck-line" id="ckLine">
        <div class="np" id="ckLineName">—</div>
        <div class="qc">
          <button type="button" onclick="ckQty(-1)">−</button>
          <input id="ckQty" type="number" value="1" min="1" max="99" oninput="ckRecalc()">
          <button type="button" onclick="ckQty(1)">+</button>
        </div>
      </div>

      <div class="ck-total">
        <span>الإجمالي</span>
        <span class="val"><span id="ckTotal">0</span> ج.م</span>
      </div>

      <form class="ck-form" onsubmit="ckSubmit(event)">
        <label>اسمك بالكامل *</label>
        <input type="text" id="ckName" required placeholder="مثلاً: أحمد محمد">

        <label>رقم الموبايل *</label>
        <input type="tel" id="ckPhone" required placeholder="01xxxxxxxxx" pattern="[0-9+ -]{6,}">

        <label>المحافظه</label>
        <select id="ckGov">
          <option value="">اختار محافظتك</option>
          ${govs.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}
        </select>

        <label>العنوان بالتفصيل</label>
        <textarea id="ckAddr" placeholder="شارع، مبنى، دور، شقه، أقرب علامه"></textarea>

        <label>ملاحظات (اختياري)</label>
        <textarea id="ckNotes" placeholder="أي تفصيله زياده"></textarea>

        <button class="ck-submit" type="submit" id="ckBtn">🚀 تأكيد الطلب</button>
        <div class="ck-err" id="ckErr" style="display:none"></div>
      </form>
    </div>
  </div>

  <script>
    var _ckItem = null;
    function escapeHtmlJs(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
    window.openCheckout = function(item){
      _ckItem = item;
      document.getElementById('ckLineName').innerHTML =
        escapeHtmlJs(item.name) + (item.variant_key ? ' <span class="var">('+escapeHtmlJs(item.variant_key)+')</span>' : '');
      document.getElementById('ckQty').value = 1;
      document.getElementById('ckErr').style.display = 'none';
      document.getElementById('ckBd').classList.add('open');
      document.getElementById('ckMd').classList.add('open');
      ckRecalc();
    };
    window.closeCheckout = function(){
      document.getElementById('ckBd').classList.remove('open');
      document.getElementById('ckMd').classList.remove('open');
    };
    window.ckQty = function(d){
      var el = document.getElementById('ckQty');
      var v = Math.max(1, Math.min(99, (parseInt(el.value,10)||1) + d));
      el.value = v; ckRecalc();
    };
    window.ckRecalc = function(){
      if (!_ckItem) return;
      var q = Math.max(1, parseInt(document.getElementById('ckQty').value,10)||1);
      var t = (Number(_ckItem.price)||0) * q;
      document.getElementById('ckTotal').textContent = t.toLocaleString('ar-EG');
    };
    window.ckSubmit = async function(e){
      e.preventDefault();
      var btn = document.getElementById('ckBtn'), err = document.getElementById('ckErr');
      err.style.display='none'; btn.disabled=true; btn.textContent='جاري إرسال طلبك...';
      var payload = {
        customer_name: document.getElementById('ckName').value.trim(),
        customer_phone: document.getElementById('ckPhone').value.trim(),
        customer_governorate: document.getElementById('ckGov').value,
        customer_address: document.getElementById('ckAddr').value.trim(),
        notes: document.getElementById('ckNotes').value.trim(),
        items: [{
          product_id: _ckItem.product_id,
          quantity: parseInt(document.getElementById('ckQty').value,10)||1,
          variant_key: _ckItem.variant_key || null,
        }],
      };
      try {
        var r = await fetch('/store/${merchant.slug}/order', {
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'text/html'},
          body: JSON.stringify(payload),
        });
        if (r.redirected || r.headers.get('content-type')?.includes('text/html')) {
          var html = await r.text();
          document.open(); document.write(html); document.close();
          return;
        }
        var data = await r.json().catch(()=>({}));
        if (!r.ok) throw new Error((data.details && data.details.join(', ')) || data.error || 'حصل خطأ');
        window.location.href = '/store/${merchant.slug}?ordered=' + (data.order_id||1);
      } catch (ex) {
        err.textContent = String(ex.message || ex);
        err.style.display = 'block';
        btn.disabled=false; btn.textContent='🚀 تأكيد الطلب';
      }
    };
  </script>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { renderCheckoutWidget };
