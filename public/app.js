// app.js — تفاعلات بسيطة بدون أي مكتبات خارجية
document.addEventListener('DOMContentLoaded', () => {
  // ---- رفع الصورة المختارة لتخزين خارجي (Vercel Blob) بدل تضمينها base64 ----
  // الصورة بتتحول لـ base64 مؤقتًا في المتصفح بس عشان تتبعت للسيرفر، اللي
  // بيرفعها لملف حقيقي ويرجّع رابط قصير — الرابط ده بس اللي بيتخزن في قاعدة
  // البيانات وبيتبعت مع الفورم، مش الصورة كاملة.
  document.querySelectorAll('.img-upload').forEach((wrap) => {
    const fileInput = wrap.querySelector('input[type=file]');
    const hidden = wrap.querySelector('input[type=hidden]');
    const preview = wrap.querySelector('img.preview');
    const placeholder = wrap.querySelector('.placeholder');
    const form = wrap.closest('form');
    const submitBtn = form ? form.querySelector('button[type=submit]') : null;
    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        alert('الصورة كبيرة أوي، اختار صورة أصغر من 4 ميجا');
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        // معاينة فورية محلية لحد ما الرفع يخلص.
        if (preview) { preview.src = reader.result; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (hidden) hidden.value = '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.origLabel = submitBtn.dataset.origLabel || submitBtn.textContent; submitBtn.textContent = '⏳ جاري رفع الصورة...'; }
        try {
          const res = await fetch('/dashboard/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl: reader.result }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.url) throw new Error(data.message || data.error || 'upload_failed');
          if (hidden) hidden.value = data.url;
        } catch (err) {
          alert('حصلت مشكلة في رفع الصورة: ' + (err.message || 'جرب تاني'));
          if (preview) preview.style.display = 'none';
          if (placeholder) placeholder.style.display = '';
          fileInput.value = '';
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.origLabel; }
        }
      };
      reader.readAsDataURL(file);
    });
  });

  // ---- اقتراح سعر البيع تلقائيًا بناءً على سعر الشراء + هامش الربح ----
  document.querySelectorAll('[data-price-suggest]').forEach((form) => {
    const cost = form.querySelector('[name=cost_price]');
    const sell = form.querySelector('[name=sell_price]');
    const margin = form.querySelector('[name=margin]');
    const hintEl = form.querySelector('.suggest-hint');
    let sellTouchedByUser = sell && sell.value && Number(sell.value) > 0;

    function recalc() {
      const c = parseFloat(cost.value) || 0;
      const marg = parseFloat(margin.value) || 0;
      const suggested = Math.round((c + (c * marg) / 100) * 100) / 100;
      if (hintEl) {
        hintEl.textContent = c > 0 ? `السعر المقترح: ${suggested} ج.م (بهامش ربح ${marg}%)` : '';
      }
      if (sell && !sellTouchedByUser) {
        sell.value = suggested || '';
      }
    }
    if (sell) {
      sell.addEventListener('input', () => {
        sellTouchedByUser = true;
      });
    }
    if (cost) cost.addEventListener('input', recalc);
    if (margin) margin.addEventListener('input', recalc);
    if (cost && cost.value) recalc();
  });

  // ---- تأكيد قبل الحذف ----
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // ---- نسخ رابط المتجر ----
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard?.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✅ اتنسخ الرابط';
        setTimeout(() => (btn.textContent = original), 1500);
      });
    });
  });

  // ---- فتح/قفل نموذج إضافة عند وجود #add في الرابط ----
  if (location.hash === '#add') {
    const el = document.getElementById('add');
    if (el && el.tagName === 'DETAILS') el.open = true;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
});

// ---- تسجيل الـ service worker (لتشغيل الأبليكيشن كأنه مثبت على الموبايل) ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
