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
    email: z.string().trim().toLowerCase().max(120).email('சரியான மின்னஞ்சல் முகவரி அல்ல (எ.கா. name@gmail.com)'),
    password: z.string().min(8, 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்').max(100),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'இரு கடவுச்சொற்களும் ஒரே மாதிரி இல்லை' });

export async function start(customerId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  await run('DELETE FROM customer_sessions WHERE expires_at < ?', [Date.now()]);
  await run('INSERT INTO customer_sessions(token_hash, customer_id, expires_at) VALUES(?,?,?)', [sha(token), customerId, Date.now() + DAYS * 864e5]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}

/** மின்னஞ்சல் அல்லது கைபேசி எண் + கடவுச்சொல் */
export async function loginCustomer(identifier: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const id = identifier.trim().toLowerCase();
  const isEmail = id.includes('@');
  const key = `c|${ip}|${id.slice(0, 80)}`;
  const n = (await get<{ n: number }>('SELECT COUNT(*) n FROM login_attempts WHERE key = ? AND at > ?', [key, Date.now() - WINDOW]))!.n;
  if (n >= 8) return { ok: false, error: 'பல முறை தவறு. 15 நிமிடம் கழித்து முயலவும்.' };
  const row = isEmail
    ? await get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM customers WHERE email = ? AND email <> ''", [id])
    : await get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM customers WHERE phone = ?', [id.replace(/\D/g, '').slice(-10)]);
  const ok = await bcrypt.compare(password, row?.password_hash || '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
  if (!row || !ok) {
    await run('INSERT INTO login_attempts(key, at) VALUES(?,?)', [key, Date.now()]);
    return { ok: false, error: 'மின்னஞ்சல் / கைபேசி எண் அல்லது கடவுச்சொல் தவறு' };
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
    "SELECT c.id, c.name, COALESCE(c.phone,'') AS phone, c.email, c.address, c.city, c.pincode FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ?",
    [sha(t), Date.now()],
  );
  return row || null;
}

export const customerOrders = (id: number) =>
  all<{ id: number; order_no: string; token: string; total: number; status: string; payment_method: string; created_at: string }>(
    'SELECT id, order_no, token, total, status, payment_method, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 50',
    [id],
  );

export const updateProfile = (id: number, v: { name: string; phone: string; address: string; city: string; pincode: string }) =>
  run("UPDATE customers SET name=?, phone=NULLIF(?, ''), address=?, city=?, pincode=? WHERE id=?", [v.name, v.phone, v.address, v.city, v.pincode, id]);

export const phoneTaken = async (phone: string, exceptId: number) => !!(phone && (await get('SELECT id FROM customers WHERE phone = ? AND id <> ?', [phone, exceptId])));

/** Google உள்நுழைவு: google_sub அல்லது (Google உறுதிசெய்த) மின்னஞ்சலால் கணக்கைக் கண்டு இணை, இல்லையெனில் புதிதாக உருவாக்கு */
export async function loginWithGoogle(p: { sub: string; email: string; name: string }): Promise<number> {
  const email = p.email.trim().toLowerCase();
  let row = await get<{ id: number }>('SELECT id FROM customers WHERE google_sub = ?', [p.sub]);
  if (!row) {
    row = await get<{ id: number }>("SELECT id FROM customers WHERE email = ? AND email <> ''", [email]);
    if (row) await run('UPDATE customers SET google_sub = ?, email_verified = 1 WHERE id = ?', [p.sub, row.id]);
  }
  if (!row) {
    const r = await run('INSERT INTO customers(name, email, email_verified, google_sub) VALUES(?,?,1,?)', [p.name.trim().slice(0, 80) || email.split('@')[0], email, p.sub]);
    row = { id: r.lastInsertRowid };
  }
  await start(row.id);
  return row.id;
}

/** ?next= திசைதிருப்பல்: தளத்துக்குள் உள்ள பாதை மட்டும் */
export const safeNext = (n: unknown) => (typeof n === 'string' && /^\/(?!\/)[\w\-./?=&%]*$/.test(n) ? n : '/account');
