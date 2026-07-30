// product-form.js — renders the extra category-specific fields on the admin
// product form. Values are collected from FormData and stored back into
// products.attributes (JSONB). Multi-select fields come in as repeated names
// which parseBody flattens to an array, or a single string.

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
      return `
        <div class="field">
          <label>${esc(attr.label)}</label>
          <div class="chip-picker" style="display:flex;flex-wrap:wrap;gap:8px;">
            ${options.map((o) => {
              const isOn = selected.includes(o);
              return `
              <label class="chip-choice" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px solid ${isOn ? 'var(--brand,#4F46E5)' : 'var(--border,#e5e7eb)'};border-radius:999px;font-size:13px;cursor:pointer;background:${isOn ? 'rgba(79,70,229,.08)' : 'white'};">
                <input type="checkbox" name="attr_${attr.key}" value="${esc(o)}" ${isOn ? 'checked' : ''} style="accent-color:var(--brand,#4F46E5);">
                ${esc(o)}
              </label>`;
            }).join('')}
          </div>
        </div>`;
    }

    return '';
  }).join('');

  return `
    <div class="attr-section" style="border-top:1px dashed var(--border,#e5e7eb);padding-top:14px;margin-top:14px;">
      <div style="font-weight:700;font-size:13px;color:var(--muted,#6b7280);margin-bottom:12px;">تفاصيل المنتج المخصوصة (${esc(cfg.label)})</div>
      ${rows}
    </div>`;
}

// Extract attribute values from a parsed request body into a plain object.
function extractAttributes(category, body) {
  const cfg = getCategoryConfig(category);
  if (!cfg) return {};
  const out = {};
  for (const attr of cfg.attributes) {
    const raw = body[`attr_${attr.key}`];
    if (raw === undefined || raw === null || raw === '') continue;
    if (attr.type === 'multi') {
      out[attr.key] = Array.isArray(raw) ? raw : [raw];
    } else {
      out[attr.key] = String(raw).trim();
    }
  }
  return out;
}

module.exports = { renderAttributeFields, extractAttributes };
