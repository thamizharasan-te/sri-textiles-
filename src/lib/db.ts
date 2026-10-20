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
  customer_id INTEGER,
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
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
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

// ---------- இயக்கி (driver) ----------
// 1) உள்ளூர் (file:)       → @libsql/client (native; Vercel-இல் ஏற்றப்படாது)
// 2) Turso (libsql://…)     → @libsql/client/web (தூய JS, HTTP; native இல்லை)
// 3) Vercel டெமோ           → Node உள்ளமைந்த node:sqlite (இணைப்புகளே தேவையில்லை; /tmp-இல்)
// இயக்கிகள் தேவைப்படும்போது மட்டும் ஏற்றப்படும் — அதனால் ஒன்று தோல்வியடைந்தாலும் முழுத் தளமும் உடையாது.

export type Arg = string | number | null;
type Row = Record<string, unknown>;
type Res = { rows: Row[]; changes: number; lastId: number };
type Exec = (sql: string, args: Arg[]) => Promise<Res>;
type Driver = { exec: Exec; multi: (sql: string) => Promise<void>; tx: <T>(fn: (e: Exec) => Promise<T>) => Promise<T> };

const READ = /^\s*(select|with|pragma)\b/i;

async function libsqlDriver(url: string): Promise<Driver> {
  const mod = url.startsWith('file:') ? await import('@libsql/client') : await import('@libsql/client/web');
  const c = mod.createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const wrap = (ex: { execute: (s: { sql: string; args: Arg[] }) => Promise<{ columns: string[]; rows: ArrayLike<unknown>[]; rowsAffected: number; lastInsertRowid?: bigint }> }): Exec =>
    async (sql, args) => {
      const r = await ex.execute({ sql, args });
      return { rows: r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, row[i]]))), changes: r.rowsAffected, lastId: Number(r.lastInsertRowid ?? 0) };
    };
  return {
    exec: wrap(c),
    multi: async (sql) => void (await c.executeMultiple(sql)),
    tx: async (fn) => {
      const t = await c.transaction('write');
      try {
        const out = await fn(wrap(t));
        await t.commit();
        return out;
      } catch (e) {
        await t.rollback().catch(() => {});
        throw e;
      } finally {
        t.close();
      }
    },
  };
}

async function nodeSqliteDriver(file: string): Promise<Driver> {
  // process.getBuiltinModule: bundler-க்குத் தெரியாமல் Node உள்ளமைந்த தொகுதியை ஏற்றும் (Node 22.3+)
  const sqlite = (process as unknown as { getBuiltinModule?: (n: string) => any }).getBuiltinModule?.('node:sqlite'); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!sqlite) throw new Error(`node:sqlite கிடைக்கவில்லை (Node ${process.version}). Node 22.13+ தேவை.`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new sqlite.DatabaseSync(file);
  const run: Exec = async (sql, args) => {
    const st = d.prepare(sql);
    // node:sqlite வரிசைகள் null-prototype; React client component-க்கு plain object தேவை
    if (READ.test(sql)) return { rows: (st.all(...args) as Row[]).map((r) => ({ ...r })), changes: 0, lastId: 0 };
    const r = st.run(...args);
    return { rows: [], changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  };
  // ஒரே இணைப்பு: பரிவர்த்தனை நடக்கும்போது மற்ற கோரிக்கைகள் காத்திருக்கும்
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
    const p = chain.then(fn, fn);
    chain = p.catch(() => {});
    return p;
  };
  let inTx = false;
  return {
    exec: (sql, args) => (inTx ? run(sql, args) : serial(() => run(sql, args))),
    multi: async (sql) => void d.exec(sql),
    tx: (fn) =>
      serial(async () => {
        inTx = true;
        d.exec('BEGIN IMMEDIATE');
        try {
          const out = await fn(run);
          d.exec('COMMIT');
          return out;
        } catch (e) {
          try { d.exec('ROLLBACK'); } catch {}
          throw e;
        } finally {
          inTx = false;
        }
      }),
  };
}

type G = typeof globalThis & { __drv?: Promise<Driver>; __ready?: Promise<void> };
const g = globalThis as G;

function driver(): Promise<Driver> {
  g.__drv ??= (async () => {
    const url = process.env.DATABASE_URL;
    if (url) return libsqlDriver(url);
    if (process.env.VERCEL) return nodeSqliteDriver(process.env.DATABASE_PATH || '/tmp/sri-shop.db');
    const file = path.resolve(process.env.DATABASE_PATH || './data/shop.db');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return libsqlDriver('file:' + file);
  })().catch((e) => {
    g.__drv = undefined;
    throw e;
  });
  return g.__drv;
}

function ready(): Promise<void> {
  g.__ready ??= (async () => {
    const d = await driver();
    await d.multi(SCHEMA);
    // பழைய டேட்டாபேஸ்களுக்கு: orders.customer_id நெடுவரிசை இல்லையெனில் சேர்
    await d.exec('ALTER TABLE orders ADD COLUMN customer_id INTEGER', []).catch(() => {});
    await d.exec('CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)', []);
    if (isDemo()) {
      try {
        const { seedDemo } = await import('./demo');
        await seedDemo(api(async () => d.exec), { admin: true });
      } catch (e) {
        console.error('டெமோ மாதிரிக் கடை உருவாக்கத் தோல்வி', e); // தளம் காலிக் கடையாகவாவது திறக்கட்டும்
      }
    }
  })().catch((e) => {
    g.__ready = undefined; // அடுத்த கோரிக்கையில் மீண்டும் முயல
    throw e;
  });
  return g.__ready;
}

export type Q = {
  all<T>(sql: string, args?: Arg[]): Promise<T[]>;
  get<T>(sql: string, args?: Arg[]): Promise<T | undefined>;
  run(sql: string, args?: Arg[]): Promise<{ changes: number; lastInsertRowid: number }>;
};

function api(getExec: () => Promise<Exec>): Q {
  const all = async <T>(sql: string, args: Arg[] = []) => (await (await getExec())(sql, args)).rows as T[];
  return {
    all,
    get: async <T>(sql: string, args: Arg[] = []) => (await all<T>(sql, args))[0],
    run: async (sql: string, args: Arg[] = []) => {
      const r = await (await getExec())(sql, args);
      return { changes: r.changes, lastInsertRowid: r.lastId };
    },
  };
}

const main = api(async () => {
  await ready();
  return (await driver()).exec;
});
export const { all, get, run } = main;
export const q: Q = main;

/** பரிவர்த்தனை: தோல்வியானால் எல்லா மாற்றமும் திரும்பப் பெறப்படும். */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  await ready();
  return (await driver()).tx((exec) => fn(api(async () => exec)));
}
