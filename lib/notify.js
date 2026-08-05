// notify.js — dispatches order notifications to a merchant's chosen channels.
// Channels supported:
//   dashboard — always on (order appears in /dashboard/orders with a badge)
//   email     — sent via Resend if RESEND_API_KEY is set and merchant has notify_email
//   telegram  — sent via a platform bot if TELEGRAM_BOT_TOKEN is set and merchant has chat id
//
// Failures are logged but never thrown — an order MUST NOT be lost because a
// notification failed. The order itself is already persisted before we get here.

const RESEND_URL = 'https://api.resend.com/emails';

function fmtItems(items) {
  return items.map((i) => {
    const line = `• ${i.name}${i.variant_key ? ` (${i.variant_key})` : ''} × ${i.quantity} = ${i.line_total} ج.م`;
    return line;
  }).join('\n');
}

function buildMessage(order, merchant, storeUrl) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = [
    `🛒 طلب جديد على متجر ${merchant.store_name}!`,
    ``,
    `العميل: ${order.customer_name}`,
    `التليفون: ${order.customer_phone}`,
    order.customer_governorate ? `المحافظه: ${order.customer_governorate}` : null,
    order.customer_address ? `العنوان: ${order.customer_address}` : null,
    order.notes ? `ملاحظات: ${order.notes}` : null,
    ``,
    `المنتجات:`,
    fmtItems(items),
    ``,
    `الإجمالي: ${order.total} ج.م`,
    ``,
    `شوف الطلب في داشبوردك: ${storeUrl}/dashboard/orders`,
  ].filter(Boolean).join('\n');
  return lines;
}

function buildEmailHtml(order, merchant, storeUrl) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items.map((i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.name)}${i.variant_key ? ` <span style="color:#888">(${escapeHtml(i.variant_key)})</span>` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:end;font-weight:600">${i.line_total} ج.م</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html dir="rtl"><body style="font-family:Tahoma,Arial,sans-serif;background:#f5f5f5;padding:20px;margin:0">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
  <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;padding:26px 24px;text-align:center">
    <div style="font-size:32px;margin-bottom:6px">🛒</div>
    <h1 style="margin:0;font-size:22px">طلب جديد على ${escapeHtml(merchant.store_name)}</h1>
  </div>
  <div style="padding:24px">
    <h2 style="margin:0 0 12px;font-size:16px;color:#333">بيانات العميل</h2>
    <table style="width:100%;font-size:14px;color:#333;margin-bottom:20px">
      <tr><td style="padding:6px 0;color:#666;width:110px">الاسم:</td><td><strong>${escapeHtml(order.customer_name)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666">التليفون:</td><td dir="ltr" style="direction:ltr;text-align:end"><strong>${escapeHtml(order.customer_phone)}</strong></td></tr>
      ${order.customer_governorate ? `<tr><td style="padding:6px 0;color:#666">المحافظه:</td><td>${escapeHtml(order.customer_governorate)}</td></tr>` : ''}
      ${order.customer_address ? `<tr><td style="padding:6px 0;color:#666;vertical-align:top">العنوان:</td><td>${escapeHtml(order.customer_address)}</td></tr>` : ''}
      ${order.notes ? `<tr><td style="padding:6px 0;color:#666;vertical-align:top">ملاحظات:</td><td>${escapeHtml(order.notes)}</td></tr>` : ''}
    </table>

    <h2 style="margin:20px 0 12px;font-size:16px;color:#333">المنتجات</h2>
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:start">المنتج</th><th style="padding:8px">الكميه</th><th style="padding:8px;text-align:end">الإجمالي</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr><td colspan="2" style="padding:12px 8px;font-weight:800;font-size:16px">الإجمالي الكلي</td><td style="padding:12px 8px;text-align:end;font-weight:800;font-size:18px;color:#4F46E5">${order.total} ج.م</td></tr></tfoot>
    </table>

    <div style="text-align:center;margin-top:26px">
      <a href="${storeUrl}/dashboard/orders" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700">📦 شوف الطلب في داشبوردك</a>
    </div>
  </div>
  <div style="background:#f9f9f9;padding:14px;text-align:center;color:#999;font-size:12px">
    ده إشعار تلقائي من متجري — الطلب اتحفظ في داشبوردك ومنتظر تأكيدك
  </div>
</div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendEmail(to, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return { ok: false, reason: 'no_key_or_recipient' };
  try {
    const from = process.env.RESEND_FROM || 'Matgari Orders <onboarding@resend.dev>';
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, reason: 'resend_error', detail: data };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, reason: 'exception', detail: String(err) };
  }
}

async function sendTelegram(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { ok: false, reason: 'no_token_or_chat' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await r.json().catch(() => ({}));
    if (!data.ok) return { ok: false, reason: 'telegram_error', detail: data };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'exception', detail: String(err) };
  }
}

async function notifyOrder(order, merchant, host) {
  const proto = host && host.includes('localhost') ? 'http' : 'https';
  const storeUrl = `${proto}://${host}`;
  const text = buildMessage(order, merchant, storeUrl);
  const channels = Array.isArray(merchant.notify_channels)
    ? merchant.notify_channels
    : ['dashboard'];

  const results = { dashboard: true };

  if (channels.includes('email') && merchant.notify_email) {
    const html = buildEmailHtml(order, merchant, storeUrl);
    const r = await sendEmail(
      merchant.notify_email,
      `🛒 طلب جديد على ${merchant.store_name}`,
      html,
      text
    );
    results.email = r.ok;
    if (!r.ok) console.error('[notify email]', r);
  }

  if (channels.includes('telegram') && merchant.notify_telegram_chat_id) {
    const r = await sendTelegram(merchant.notify_telegram_chat_id, text);
    results.telegram = r.ok;
    if (!r.ok) console.error('[notify telegram]', r);
  }

  return results;
}

module.exports = { notifyOrder, sendEmail, sendTelegram };
