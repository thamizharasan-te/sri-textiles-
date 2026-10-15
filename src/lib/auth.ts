import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

const COOKIE = 'st_admin';
const DAYS = 7;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const hashPassword = (p: string) => bcrypt.hash(p, 12);

// எளிய முயற்சி வரம்பு (brute-force தடுக்க): 15 நிமிடத்தில் 8 தவறுகள்
const attempts = new Map<string, number[]>();
function tooMany(key: string) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(key, list);
  return list.length >= 8;
}

export async function login(username: string, password: string, ip: string): Promise<{ ok: boolean; error?: string }> {
  const key = `${ip}|${username.toLowerCase()}`;
  if (tooMany(key)) return { ok: false, error: 'பல முறை தவறு. 15 நிமிடம் கழித்து முயலவும்.' };
  const row = db().prepare('SELECT id, password_hash FROM admins WHERE username = ?').get(username) as
    | { id: number; password_hash: string }
    | undefined;
  // பயனர் இல்லாவிட்டாலும் hash ஒப்பிடுகிறோம் (நேர வேறுபாட்டால் பெயர் கண்டறிவதைத் தடுக்க)
  const ok = await bcrypt.compare(password, row?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin');
  if (!row || !ok) {
    attempts.get(key)!.push(Date.now());
    return { ok: false, error: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறு' };
  }
  attempts.delete(key);
  const token = crypto.randomBytes(32).toString('hex');
  db().prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db().prepare('INSERT INTO sessions(token_hash, admin_id, expires_at) VALUES(?,?,?)').run(sha(token), row.id, Date.now() + DAYS * 864e5);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && (process.env.SITE_URL || '').startsWith('https'),
    path: '/',
    maxAge: DAYS * 86400,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
  jar.delete(COOKIE);
}

export async function currentAdmin(): Promise<{ id: number; username: string } | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const row = db()
    .prepare('SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .get(sha(t), Date.now()) as { id: number; username: string } | undefined;
  return row || null;
}

export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) redirect('/admin/login');
  return a;
}

export async function changePassword(adminId: number, current: string, next: string): Promise<string | null> {
  const row = db().prepare('SELECT password_hash FROM admins WHERE id = ?').get(adminId) as { password_hash: string } | undefined;
  if (!row || !(await bcrypt.compare(current, row.password_hash))) return 'தற்போதைய கடவுச்சொல் தவறு';
  db().prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(await hashPassword(next), adminId);
  return null;
}
