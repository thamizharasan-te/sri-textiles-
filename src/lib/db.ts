import { createClient, type Client, type Transaction } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { isDemo } from './env';

// DATABASE_URL: Turso → libsql://xxxx.turso.io (+ DATABASE_AUTH_TOKEN). உள்ளூர் → file:./data/shop.db (இயல்புநிலை)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id INTEGER,
  price INTEGER NOT NULL,
  mrp INTEGER,
  fabric TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  gst_rate INTEGER NOT NULL DEFAULT 5,
  size_info TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  file TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS product_sizes (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, label)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  order_no TEXT UNIQUE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'new',
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  rzp_order_id TEXT,
  rzp_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  gst_rate INTEGER NOT NULL DEFAULT 5
);
CREATE TABLE IF NOT EXISTS order_log (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_sizes_product ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_attempts_key ON login_attempts(key);
`;

type G = typeof globalThis & { __lib?: Client; __ready?: Promise<void> };
const g = globalThis as G;

function client(): Client {
  if (g.__lib) return g.__lib;
  let url = process.env.DATABASE_URL;
  if (!url) {
    const file = path.resolve(process.env.DATABASE_PATH || (isDemo() && process.env.VERCEL ? '/tmp/sri-shop.db' : './data/shop.db'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    url = 'file:' + file;
  }
  g.__lib = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  return g.__lib;
}

function ready(): Promise<void> {
  g.__ready ??= client()
    .executeMultiple(SCHEMA)
    .then(async () => {
      if (isDemo()) {
        const { seedDemo } = await import('./demo');
        await seedDemo(api(async () => client()), { admin: true });
      }
    })
    .catch((e) => {
      g.__ready = undefined; // அடுத்த கோரிக்கையில் மீண்டும் முயல
      throw e;
    });
  return g.__ready;
}

export type Arg = string | number | null;
export type Q = {
  all<T>(sql: string, args?: Arg[]): Promise<T[]>;
  get<T>(sql: string, args?: Arg[]): Promise<T | undefined>;
  run(sql: string, args?: Arg[]): Promise<{ changes: number; lastInsertRowid: number }>;
};

function api(getEx: () => Promise<Client | Transaction>): Q {
  const exec = async (sql: string, args: Arg[]) => (await getEx()).execute({ sql, args });
  const all = async <T>(sql: string, args: Arg[] = []) => {
    const r = await exec(sql, args);
    return r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]]))) as T[];
  };
  return {
    all,
    get: async <T>(sql: string, args: Arg[] = []) => (await all<T>(sql, args))[0],
    run: async (sql: string, args: Arg[] = []) => {
      const r = await exec(sql, args);
      return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid ?? 0) };
    },
  };
}

const main = api(async () => {
  await ready();
  return client();
});
export const { all, get, run } = main;
export const q: Q = main;

/** பரிவர்த்தனை: தோல்வியானால் எல்லா மாற்றமும் திரும்பப் பெறப்படும். */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  await ready();
  const t = await client().transaction('write');
  try {
    const out = await fn(api(async () => t));
    await t.commit();
    return out;
  } catch (e) {
    await t.rollback().catch(() => {});
    throw e;
  } finally {
    t.close();
  }
}
