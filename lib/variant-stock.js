// variant-stock.js — helpers for per-variant inventory tracking.
// A category's config declares `stockKey` (e.g. 'sizes' for shoes, 'volumes'
// for perfumes). Products of that category store variant_stock as a
// { variantValue: qty } JSON map. The purchases form asks "how many of each",
// the sales form deducts by variant, and the storefront hides variants where
// qty <= 0.

const { esc } = require('./view');
const { getCategoryConfig } = require('./category-configs');

// Which attribute is the "variant" (size/volume/etc.) for this category?
function stockKeyFor(category) {
  const cfg = getCategoryConfig(category);
  return cfg ? cfg.stockKey || null : null;
}

// Parse the attribute list of a product to get its variant values (["37","38"]).
function variantValues(product, category) {
  const key = stockKeyFor(category);
  if (!key) return [];
  const attrs = coerceJson(product.attributes);
  const v = attrs[key];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function coerceJson(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }
  return raw;
}

// Read a product's variant_stock, safely.
function readStockMap(product) {
  return coerceJson(product.variant_stock);
}

// Sum of all per-variant stocks — used to keep products.quantity in sync.
function totalFromStockMap(stockMap) {
  return Object.values(stockMap || {}).reduce((s, n) => s + (Number(n) || 0), 0);
}

// Render per-variant qty inputs for the given product.
// namePrefix should be unique per form (e.g. `stock_37`) so the parser knows
// which input maps to which variant value.
function renderVariantQtyInputs(product, category, current) {
  const values = variantValues(product, category);
  if (!values.length) return '';
  const stock = current || readStockMap(product);
  return `
    <div style="border:1px dashed var(--border,#e5e7eb);border-radius:12px;padding:12px;margin:12px 0;background:#fafafa;">
      <div style="font-weight:700;font-size:12.5px;margin-bottom:10px;color:var(--muted,#6b7280);">
        الكميه لكل ${categoryStockLabel(category)}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
        ${values.map((v) => `
          <label style="display:flex;flex-direction:column;gap:4px;">
            <span style="font-size:12px;font-weight:600;">${esc(v)}</span>
            <input type="number" name="stock_${esc(v)}" min="0" value="${Number(stock[v]) || 0}"
              style="border:1.5px solid var(--border,#e5e7eb);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:14px;">
          </label>
        `).join('')}
      </div>
    </div>`;
}

function categoryStockLabel(category) {
  const cfg = getCategoryConfig(category);
  if (!cfg) return 'قطعه';
  const key = cfg.stockKey;
  if (!key) return 'قطعه';
  const attr = cfg.attributes.find((a) => a.key === key);
  return attr ? attr.label : 'قطعه';
}

// Extract stock map from a parsed body: any body key starting with `stock_`
// becomes an entry. Returns { "37": 5, "38": 10 }.
function extractStockMap(body) {
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (!k.startsWith('stock_')) continue;
    const value = k.slice('stock_'.length);
    if (!value) continue;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 0) continue;
    out[value] = n;
  }
  return out;
}

module.exports = {
  stockKeyFor,
  variantValues,
  readStockMap,
  totalFromStockMap,
  renderVariantQtyInputs,
  extractStockMap,
  categoryStockLabel,
};
