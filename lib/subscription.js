// subscription.js — helpers for subscription status/expiry logic.
// A merchant is considered "active" if:
//   - status is 'trial' or 'active', AND
//   - subscription_expires_at is in the future (or null → treat as expired)

const GRACE_DAYS = 0;

function daysLeft(expiresAt) {
  if (!expiresAt) return -999;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isActive(merchant) {
  if (!merchant) return false;
  const status = merchant.subscription_status;
  if (status === 'cancelled' || status === 'expired') return false;
  const dl = daysLeft(merchant.subscription_expires_at);
  return dl + GRACE_DAYS > 0;
}

// Bucket for UI color coding.
//   ok      → green   (> 7 days left)
//   warning → yellow  (4–7 days)
//   urgent  → orange  (1–3 days)
//   expired → red     (<= 0 days OR status expired/cancelled)
function bucket(merchant) {
  if (!merchant) return 'expired';
  const status = merchant.subscription_status;
  if (status === 'cancelled' || status === 'expired') return 'expired';
  const dl = daysLeft(merchant.subscription_expires_at);
  if (dl <= 0) return 'expired';
  if (dl <= 3) return 'urgent';
  if (dl <= 7) return 'warning';
  return 'ok';
}

module.exports = { daysLeft, isActive, bucket };
