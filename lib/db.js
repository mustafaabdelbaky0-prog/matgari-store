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

// query(sqlText, params) → rows[]
// Uses sql.query() — the documented "unsafe" form for dynamic SQL strings.
// (Calling `sql(text, params)` treats `text` as a template-string array and
// silently produces wrong SQL, so avoid it.)
async function query(text, params = []) {
  await init();
  return sql.query(text, params);
}

// queryOne(sqlText, params) → first row (or null)
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
}

// exec — for INSERT/UPDATE/DELETE; returns rows
async function exec(text, params = []) {
  await init();
  return sql.query(text, params);
}

module.exports = { sql, query, queryOne, exec, init };
