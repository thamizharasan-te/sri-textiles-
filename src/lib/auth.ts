import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, run } from './db';

const COOKIE = 'st_admin';
const DAYS = 7;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const hashPassword = (p: string) => bcrypt.hash(p, 12);

// முயற்சி வரம்பு (brute-force தடுக்க): 15 நிமிடத்தில் 8 தவறுகள். DB-இல் சேமிப்பதால் பல serverless instance-களிலும் வேலை செய்யும்.
const WINDOW = 15 * 60 * 1000;
async function tooMany(key: string) {
  const r = await get<{ n: number }>('SELECT COUNT(*) n FROM login_attempts WHERE key = ? AND at > ?', [key, Date.now() - WINDOW]);
  return (r?.n ?? 0) >= 8;
}

export async function login(username: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const key = `${ip}|${username.toLowerCase()}`;
  if (await tooMany(key)) return { ok: false, error: 'பல முறை தவறு. 15 நிமிடம் கழித்து முயலவும்.' };
  const row = await get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM admins WHERE username = ?', [username]);
  // பயனர் இல்லாவிட்டாலும் hash ஒப்பிடுகிறோம் (நேர வேறுபாட்டால் பெயர் கண்டறிவதைத் தடுக்க)
  const ok = await bcrypt.compare(password, row?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
  if (!row || !ok) {
    await run('INSERT INTO login_attempts(key, at) VALUES(?,?)', [key, Date.now()]);
    return { ok: false, error: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறு' };
  }
  await run('DELETE FROM login_attempts WHERE key = ? OR at < ?', [key, Date.now() - WINDOW]);
  const token = crypto.randomBytes(32).toString('hex');
  await run('DELETE FROM sessions WHERE expires_at < ?', [Date.now()]);
  await run('INSERT INTO sessions(token_hash, admin_id, expires_at) VALUES(?,?,?)', [sha(token), row.id, Date.now() + DAYS * 864e5]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DAYS * 86400,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await run('DELETE FROM sessions WHERE token_hash = ?', [sha(t)]);
  jar.delete(COOKIE);
}

export async function currentAdmin(): Promise<{ id: number; username: string } | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const row = await get<{ id: number; username: string }>(
    'SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?',
    [sha(t), Date.now()],
  );
  return row || null;
}

export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) redirect('/admin/login');
  return a;
}

export async function changePassword(adminId: number, current: string, next: string): Promise<string | null> {
  const row = await get<{ password_hash: string }>('SELECT password_hash FROM admins WHERE id = ?', [adminId]);
  if (!row || !(await bcrypt.compare(current, row.password_hash))) return 'தற்போதைய கடவுச்சொல் தவறு';
  await run('UPDATE admins SET password_hash = ? WHERE id = ?', [await hashPassword(next), adminId]);
  return null;
}
