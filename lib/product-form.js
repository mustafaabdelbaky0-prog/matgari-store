// product-form.js — renders the extra category-specific fields on the admin
// product form. Values are collected from FormData and stored back into
// products.attributes (JSONB).
//
// For `multi` attributes: renders a tag-input that lets the merchant pick from
// the config's suggestions AND add any custom value they type. Free-form.

const { esc } = require('./view');
const { getCategoryConfig } = require('./category-configs');

function renderAttributeFields(category, attributes = {}) {
  const cfg = getCategoryConfig(category);
  if (!cfg || !cfg.attributes.length) return '';

  const rows = cfg.attributes.map((attr) => {
    const current = attributes[attr.key];

    if (attr.type === 'text') {
      return `
        <div class="field">
          <label>${esc(attr.label)}</label>
          <input type="text" name="attr_${attr.key}" value="${esc(current || '')}" placeholder="${esc(attr.placeholder || '')}">
        </div>`;
    }

    if (attr.type === 'select') {
      const options = attr.options || [];
      return `
        <div class="field">
          <label>${esc(attr.label)}</label>
          <select name="attr_${attr.key}">
            <option value="">— اختار —</option>
            ${options.map((o) => `<option value="${esc(o)}" ${o === current ? 'selected' : ''}>${esc(o)}</option>`).join('')}
          </select>
        </div>`;
    }

    if (attr.type === 'multi') {
      const options = attr.options || [];
      const selected = Array.isArray(current) ? current : (current ? [current] : []);
      // Suggestions = predefined options minus already-selected values.
      const suggestions = options.filter((o) => !selected.includes(o));
      return `
        <div class="field" data-multi-field data-attr-key="${esc(attr.key)}">
          <label>${esc(attr.label)}</label>
          <div class="ml-selected" style="display:flex;flex-wrap:wrap;gap:6px;min-height:14px;margin-bottom:8px;">
            ${selected.map((v) => renderSelectedChip(attr.key, v)).join('')}
          </div>
          <div style="display:flex;gap:6px;">
            <input type="text" class="ml-input" placeholder="اكتب قيمه واضغط Enter (أو ',')"
              style="flex:1;border:1.5px solid var(--border,#e5e7eb);border-radius:10px;padding:8px 12px;font-family:inherit;font-size:14px;">
            <button type="button" class="ml-add btn" style="background:var(--brand,#4F46E5);color:#fff;border:none;padding:0 14px;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;">إضافه</button>
          </div>
          ${suggestions.length ? `
            <div class="ml-hints" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
              <span style="font-size:11px;color:var(--muted,#6b7280);align-self:center;margin-inline-end:4px;">اقتراحات:</span>
              ${suggestions.map((o) => `
                <button type="button" class="ml-hint" data-value="${esc(o)}"
                  style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;color:#4b5563;">+ ${esc(o)}</button>
              `).join('')}
            </div>
          ` : ''}
        </div>`;
    }

    return '';
  }).join('');

  return `
    <div class="attr-section" style="border-top:1px dashed var(--border,#e5e7eb);padding-top:14px;margin-top:14px;">
      <div style="font-weight:700;font-size:13px;color:var(--muted,#6b7280);margin-bottom:12px;">تفاصيل المنتج المخصوصه (${esc(cfg.label)})</div>
      ${rows}
    </div>
    ${MULTI_SCRIPT}`;
}

function renderSelectedChip(key, value) {
  return `<span class="ml-chip" style="display:inline-flex;align-items:center;gap:6px;background:rgba(79,70,229,.10);color:var(--brand,#4F46E5);border:1px solid rgba(79,70,229,.25);border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;">
    <input type="hidden" name="attr_${esc(key)}" value="${esc(value)}">
    <span>${esc(value)}</span>
    <button type="button" class="ml-remove" title="حذف" style="background:none;border:none;color:var(--brand,#4F46E5);font-size:15px;line-height:1;cursor:pointer;padding:0;font-weight:800;">×</button>
  </span>`;
}

// Client-side glue rendered ONCE inside the attr section; delegates via
// data-multi-field ancestor so it works for all multi fields on the page.
const MULTI_SCRIPT = `
<script>
(function(){
  if (window.__multiTagInit) return;
  window.__multiTagInit = true;

  function makeChip(key, value){
    const span = document.createElement('span');
    span.className = 'ml-chip';
    span.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:rgba(79,70,229,.10);color:var(--brand,#4F46E5);border:1px solid rgba(79,70,229,.25);border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;';
    const inp = document.createElement('input');
    inp.type = 'hidden'; inp.name = 'attr_'+key; inp.value = value;
    const txt = document.createElement('span'); txt.textContent = value;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ml-remove'; btn.textContent = '×';
    btn.style.cssText = 'background:none;border:none;color:var(--brand,#4F46E5);font-size:15px;line-height:1;cursor:pointer;padding:0;font-weight:800;';
    span.append(inp, txt, btn);
    return span;
  }

  function addValue(field, raw){
    const value = String(raw || '').trim();
    if (!value) return;
    const key = field.dataset.attrKey;
    const holder = field.querySelector('.ml-selected');
    // No duplicates.
    const existing = Array.from(holder.querySelectorAll('input[type=hidden]')).map(i => i.value);
    if (existing.includes(value)) return;
    holder.appendChild(makeChip(key, value));
    // Also hide from hints if present.
    const hint = field.querySelector('.ml-hint[data-value="'+ CSS.escape(value) +'"]');
    if (hint) hint.remove();
  }

  document.addEventListener('click', function(e){
    // Remove chip
    if (e.target.classList && e.target.classList.contains('ml-remove')){
      const chip = e.target.closest('.ml-chip');
      const field = e.target.closest('[data-multi-field]');
      if (chip && field){
        const val = chip.querySelector('input[type=hidden]').value;
        chip.remove();
        // Re-add as hint if it's a known suggestion or just leave user's custom value gone.
        // For simplicity we just remove; user can retype it.
      }
    }
    // Add via suggestion chip
    if (e.target.classList && e.target.classList.contains('ml-hint')){
      e.preventDefault();
      const field = e.target.closest('[data-multi-field]');
      addValue(field, e.target.dataset.value);
    }
    // Add via + button
    if (e.target.classList && e.target.classList.contains('ml-add')){
      e.preventDefault();
      const field = e.target.closest('[data-multi-field]');
      const input = field.querySelector('.ml-input');
      addValue(field, input.value);
      input.value = '';
      input.focus();
    }
  });

  document.addEventListener('keydown', function(e){
    if (!e.target.classList || !e.target.classList.contains('ml-input')) return;
    if (e.key === 'Enter' || e.key === ',' || e.key === '،'){
      e.preventDefault();
      const field = e.target.closest('[data-multi-field]');
      addValue(field, e.target.value.replace(/[,،]$/,''));
      e.target.value = '';
    }
  });
})();
</script>
`;

// Extract attribute values from a parsed request body into a plain object.
function extractAttributes(category, body) {
  const cfg = getCategoryConfig(category);
  if (!cfg) return {};
  const out = {};
  for (const attr of cfg.attributes) {
    const raw = body[`attr_${attr.key}`];
    if (raw === undefined || raw === null || raw === '') continue;
    if (attr.type === 'multi') {
      out[attr.key] = Array.isArray(raw) ? raw.filter(Boolean) : [raw].filter(Boolean);
    } else {
      out[attr.key] = String(raw).trim();
    }
  }
  return out;
}

module.exports = { renderAttributeFields, extractAttributes };
