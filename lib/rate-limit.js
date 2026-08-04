// rate-limit.js — simple sliding-window rate limiting backed by the same
// Postgres database (no new external service/dependency needed).
//
// Usage:
//   const blocked = (await rateLimit.count('login_fail', phone, 15*60)) >= 8;
//   if (blocked) return fail('حاول تاني بعد شوية');
//   ... on actual failure ...
//   await rateLimit.hit('login_fail', phone);
//
// A single small table stores one row per event. Reads filter by a time
// window so old events simply stop counting — no separate reset job needed.
// `cleanup()` is called opportunistically (not on every request) to keep the
// table small.

const { exec, queryOne } = require('./db');

let initPromise = null;
function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await exec(`
      CREATE TABLE IF NOT EXISTS rate_events (
        id SERIAL PRIMARY KEY,
        bucket TEXT NOT NULL,
        key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await exec(`CREATE INDEX IF NOT EXISTS idx_rate_events_lookup ON rate_events (bucket, key, created_at)`);
  })();
  return initPromise;
}

// How many events for (bucket, key) happened in the last windowSeconds?
async function count(bucket, key, windowSeconds) {
  await init();
  const row = await queryOne(
    `SELECT COUNT(*) AS c FROM rate_events
     WHERE bucket = $1 AND key = $2 AND created_at > NOW() - ($3 || ' seconds')::interval`,
    [bucket, key, String(windowSeconds)]
  );
  return Number(row ? row.c : 0);
}

// Record one event (e.g. a failed login attempt, a support message sent).
async function hit(bucket, key) {
  await init();
  await exec('INSERT INTO rate_events (bucket, key) VALUES ($1, $2)', [bucket, key]);
  // Cheap opportunistic cleanup so the table doesn't grow forever — only
  // runs ~1% of the time so it doesn't add latency to every request.
  if (Math.random() < 0.01) {
    exec(`DELETE FROM rate_events WHERE created_at < NOW() - INTERVAL '7 days'`).catch(() => {});
  }
}

module.exports = { count, hit };
