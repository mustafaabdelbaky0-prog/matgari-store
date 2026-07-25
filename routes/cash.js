const { query, queryOne, exec } = require('../lib/db');
const { dashboardPage, esc, money } = require('../lib/view');
const { sendHtml, redirect } = require('../lib/http-helpers');
const { parseBody } = require('../lib/body');

function registerRoutes(router) {
  router.get('/dashboard/cash', async (req, res) => {
    const m = req.merchant;
    const totals = await queryOne(`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('sale','income') THEN amount ELSE 0 END),0) AS income,
        COALESCE(SUM(CASE WHEN type IN ('purchase','expense') THEN amount ELSE 0 END),0) AS expense
      FROM transactions WHERE merchant_id = $1
    `, [m.id]);
    const balance = Number(totals.income) - Number(totals.expense);
    const list = await query('SELECT * FROM transactions WHERE merchant_id = $1 ORDER BY id DESC LIMIT 80', [m.id]);

    const typeMeta = {
      sale: { icon: '🧾', label: 'بيع', sign: '+' },
      purchase: { icon: '🛒', label: 'شراء', sign: '-' },
      income: { icon: '💵', label: 'إيراد إضافي', sign: '+' },
      expense: { icon: '📤', label: 'مصروف', sign: '-' },
    };

    const body = `
      <div class="card" style="text-align:center;">
        <div class="card-title">رصيد الخزنة الحالي</div>
        <div style="font-size:30px;font-weight:900;color:${balance >= 0 ? 'var(--success)' : 'var(--danger)'};">${money(balance)}</div>
      </div>

      <div class="grid-2">
        <div class="stat success"><div class="label">إجمالي الإيرادات</div><div class="value">${money(totals.income)}</div></div>
        <div class="stat danger"><div class="label">إجمالي المصروفات</div><div class="value">${money(totals.expense)}</div></div>
      </div>

      <details id="add" class="card mt-16">
        <summary style="cursor:pointer;font-weight:800;font-size:15px;">➕ حركة يدوية (مصروف / إيراد إضافي)</summary>
        <div class="mt-16">
          <form method="POST" action="/dashboard/cash/add">
            <div class="field">
              <label>النوع</label>
              <select name="type" required>
                <option value="expense">📤 مصروف (شحن، إيجار، تسويق...)</option>
                <option value="income">💵 إيراد إضافي</option>
              </select>
            </div>
            <div class="input-row">
              <div class="field"><label>المبلغ</label><input type="number" step="0.01" min="0" name="amount" required></div>
              <div class="field"><label>البيان</label><input type="text" name="note" placeholder="مثال: شحن أوردر"></div>
            </div>
            <button class="btn btn-primary" type="submit">تسجيل الحركة</button>
          </form>
        </div>
      </details>

      <div class="card">
        <div class="card-title">كل الحركات</div>
        ${list.length === 0 ? `<div class="empty"><div class="big">💰</div>الخزنة لسه فاضية</div>` : list.map((t) => {
          const meta = typeMeta[t.type] || { icon: '•', label: t.type, sign: '' };
          return `
          <div class="row">
            <div class="thumb">${meta.icon}</div>
            <div class="main">
              <div class="title">${esc(t.product_name || t.note || meta.label)}</div>
              <div class="meta">${meta.label} · ${t.created_at}</div>
            </div>
            <div class="amount" style="color:${meta.sign === '+' ? 'var(--success)' : 'var(--danger)'};">${meta.sign}${money(t.amount)}</div>
          </div>`;
        }).join('')}
      </div>
    `;

    sendHtml(res, 200, dashboardPage({ title: 'الخزنة', merchant: m, activeKey: 'cash', subtitle: 'كل فلوسك في مكان واحد', body }));
  });

  router.post('/dashboard/cash/add', async (req, res) => {
    const m = req.merchant;
    const b = await parseBody(req);
    const type = b.type === 'income' ? 'income' : 'expense';
    const amount = parseFloat(b.amount) || 0;
    if (amount <= 0) return redirect(res, '/dashboard/cash');

    await exec(`
      INSERT INTO transactions (merchant_id, type, quantity, amount, note)
      VALUES ($1, $2, 1, $3, $4)
    `, [m.id, type, amount, (b.note || '').trim()]);

    redirect(res, '/dashboard/cash');
  });
}

module.exports = { registerRoutes };
