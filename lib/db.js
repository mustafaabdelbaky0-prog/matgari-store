// db.js — Neon Postgres via HTTP (works in serverless cold starts).
// Provides a small helper API so routes can stay compact.

const { neon } = require('@neondatabase/serverless');

const CONN =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED;

if (!CONN) {
  throw new Error('No Postgres connection string in env (POSTGRES_URL / DATABASE_URL)');
}

const sql = neon(CONN);

let initPromise = null;
function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // Postgres schema (translated from the previous SQLite schema).
    await sql`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        store_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category TEXT,
        whatsapp TEXT,
        onboarded INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Merchant-defined sections (e.g. "عروض الصيف", "وصل حديثًا").
    await sql`
      ALTER TABLE merchants
      ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[]'::jsonb
    `;
    // Subscription tracking. New signups get a 30-day trial; admin can extend,
    // cancel, or mark active from the admin dashboard.
    await sql`
      ALTER TABLE merchants
      ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    `;
    await sql`
      ALTER TABLE merchants
      ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'trial'
    `;
    await sql`
      ALTER TABLE merchants
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE merchants
      ADD COLUMN IF NOT EXISTS subscription_notes TEXT
    `;
    // Backfill: any merchant without an expiry gets 30 days from their signup date.
    await sql`
      UPDATE merchants
      SET subscription_expires_at = created_at + INTERVAL '30 days'
      WHERE subscription_expires_at IS NULL
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        cost_price REAL NOT NULL DEFAULT 0,
        sell_price REAL NOT NULL DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        visible INTEGER NOT NULL DEFAULT 1,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    // Adds the attributes column to existing tables (no-op if it already exists).
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb
    `;
    // Per-variant stock (e.g. {"37": 5, "38": 0}) — keyed by the value of the
    // category-config's stockKey attribute (sizes / volumes / etc.).
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS variant_stock JSONB NOT NULL DEFAULT '{}'::jsonb
    `;
    // Marketing feedback: visitor suggestions, AI-chat questions, and design
    // requests submitted from the public landing page.
    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        contact TEXT,
        message TEXT NOT NULL,
        source_ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        product_id INTEGER,
        product_name TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        amount REAL NOT NULL DEFAULT 0,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })();
  return initPromise;
}

// Normalize any of neon's possible response shapes into a rows array.
function toRows(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
}

// query(sqlText, params) → rows[]
async function query(text, params = []) {
  await init();
  // Bind `this` so destructured sql.query keeps its context.
  const res = typeof sql.query === 'function'
    ? await sql.query(text, params)
    : await sql(text, params);
  return toRows(res);
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// exec — for INSERT/UPDATE/DELETE; returns rows array
async function exec(text, params = []) {
  return query(text, params);
}

module.exports = { sql, query, queryOne, exec, init };
