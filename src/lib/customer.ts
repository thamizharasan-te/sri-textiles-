import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { all, get, run } from './db';

const COOKIE = 'st_cust';
const DAYS = 30;
const WINDOW = 15 * 60 * 1000;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export type Customer = { id: number; name: string; phone: string; email: string; address: string; city: string; pincode: string };

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'பெயரை உள்ளிடவும்').max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்'),
    email: z.string().trim().max(120).email('சரியான மின்னஞ்சல் முகவரி அல்ல').or(z.literal('')),
    password: z.string().min(8, 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்').max(100),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'இரு கடவுச்சொற்களும் ஒரே மாதிரி இல்லை' });

async function start(customerId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  await run('DELETE FROM customer_sessions WHERE expires_at < ?', [Date.now()]);
  await run('INSERT INTO customer_sessions(token_hash, customer_id, expires_at) VALUES(?,?,?)', [sha(token), customerId, Date.now() + DAYS * 864e5]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

export async function signup(v: z.output<typeof signupSchema>): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  if (await get('SELECT id FROM customers WHERE phone = ?', [v.phone])) return { ok: false, field: 'phone', error: 'இந்த கைபேசி எண்ணில் கணக்கு ஏற்கனவே உள்ளது. உள்நுழையவும்.' };
  const r = await run('INSERT INTO customers(name,phone,email,password_hash) VALUES(?,?,?,?)', [v.name, v.phone, v.email, await bcrypt.hash(v.password, 10)]);
  await start(r.lastInsertRowid);
  return { ok: true };
}

export async function loginCustomer(phone: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const key = `c|${ip}|${phone}`;
  const n = (await get<{ n: number }>('SELECT COUNT(*) n FROM login_attempts WHERE key = ? AND at > ?', [key, Date.now() - WINDOW]))!.n;
  if (n >= 8) return { ok: false, error: 'பல முறை தவறு. 15 நிமிடம் கழித்து முயலவும்.' };
  const row = await get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM customers WHERE phone = ?', [phone]);
  const ok = await bcrypt.compare(password, row?.password_hash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
  if (!row || !ok) {
    await run('INSERT INTO login_attempts(key, at) VALUES(?,?)', [key, Date.now()]);
    return { ok: false, error: 'கைபேசி எண் அல்லது கடவுச்சொல் தவறு' };
  }
  await run('DELETE FROM login_attempts WHERE key = ? OR at < ?', [key, Date.now() - WINDOW]);
  await start(row.id);
  return { ok: true };
}

export async function logoutCustomer() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await run('DELETE FROM customer_sessions WHERE token_hash = ?', [sha(t)]);
  jar.delete(COOKIE);
}

export async function currentCustomer(): Promise<Customer | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const row = await get<Customer>(
    'SELECT c.id, c.name, c.phone, c.email, c.address, c.city, c.pincode FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ?',
    [sha(t), Date.now()],
  );
  return row || null;
}

export const customerOrders = (id: number) =>
  all<{ id: number; order_no: string; token: string; total: number; status: string; payment_method: string; created_at: string }>(
    'SELECT id, order_no, token, total, status, payment_method, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 50',
    [id],
  );

export const updateProfile = (id: number, v: { name: string; email: string; address: string; city: string; pincode: string }) =>
  run('UPDATE customers SET name=?, email=?, address=?, city=?, pincode=? WHERE id=?', [v.name, v.email, v.address, v.city, v.pincode, id]);

/** ?next= திசைதிருப்பல்: தளத்துக்குள் உள்ள பாதை மட்டும் */
export const safeNext = (n: unknown) => (typeof n === 'string' && /^\/(?!\/)[\w\-./?=&%]*$/.test(n) ? n : '/account');
