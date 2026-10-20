import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { get, run } from './db';
import { isDemo } from './env';
import { sendVerificationEmail, smtpConfigured } from './email';
import { start } from './customer';

// மின்னஞ்சல் சரிபார்ப்பு: 6 இலக்கக் குறியீடு, 10 நிமிடம் செல்லும், 5 தவறான முயற்சி, 60 வினாடி மறுஅனுப்பு இடைவெளி.
const COOKIE = 'st_pv';
const TTL = 10 * 60 * 1000;
const COOLDOWN = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 5;
const HOUR = 60 * 60 * 1000;
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const codeHash = (token: string, code: string) => sha(`${token}:${code}`);
const newCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/** SMTP இல்லாத டெமோ / உள்ளூர் மேம்பாட்டில் மட்டும் குறியீட்டைத் திரையில் காட்டும் */
const showCode = () => !smtpConfigured() && (isDemo() || process.env.NODE_ENV !== 'production');

type Row = { id: number; token_hash: string; email: string; code_hash: string; name: string; phone: string; password_hash: string; next: string; dev_code: string; attempts: number; sends: number; last_sent_at: number; expires_at: number };

export const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(1, Math.min(5, u.length - 2)))}@${d}`;
};

async function setCookie(token: string) {
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: TTL / 1000 + 300 });
}

async function pendingRow(): Promise<{ row: Row; token: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{48}$/.test(token)) return null;
  const row = await get<Row>('SELECT * FROM email_verifications WHERE token_hash = ?', [sha(token)]);
  return row && row.expires_at > Date.now() ? { row, token } : null;
}

export async function startSignup(v: { name: string; email: string; phone: string; password: string; next: string }, ip: string): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  if (!smtpConfigured() && !showCode()) return { ok: false, error: 'மின்னஞ்சல் சேவை இன்னும் அமைக்கப்படவில்லை. கடையைத் தொடர்பு கொள்ளவும்.' };
  const rk = `v|${ip}`;
  const sent = (await get<{ n: number }>('SELECT COUNT(*) n FROM login_attempts WHERE key = ? AND at > ?', [rk, Date.now() - HOUR]))!.n;
  if (sent >= 10) return { ok: false, error: 'பல முறை முயன்றுவிட்டீர்கள். ஒரு மணி நேரம் கழித்து முயலவும்.' };
  if (await get('SELECT id FROM customers WHERE email = ?', [v.email])) return { ok: false, field: 'email', error: 'இந்த மின்னஞ்சலில் கணக்கு ஏற்கனவே உள்ளது. உள்நுழையவும்.' };
  if (await get('SELECT id FROM customers WHERE phone = ?', [v.phone])) return { ok: false, field: 'phone', error: 'இந்த கைபேசி எண்ணில் கணக்கு ஏற்கனவே உள்ளது. உள்நுழையவும்.' };
  await run('INSERT INTO login_attempts(key, at) VALUES(?,?)', [rk, Date.now()]);

  const token = crypto.randomBytes(24).toString('hex');
  const code = newCode();
  await run('DELETE FROM email_verifications WHERE email = ? OR expires_at < ?', [v.email, Date.now()]);
  await run(
    'INSERT INTO email_verifications(token_hash,email,code_hash,name,phone,password_hash,next,dev_code,last_sent_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    [sha(token), v.email, codeHash(token, code), v.name, v.phone, await bcrypt.hash(v.password, 10), v.next, showCode() ? code : '', Date.now(), Date.now() + TTL],
  );
  const mailed = await sendVerificationEmail(v.email, v.name, code);
  if (!mailed && !showCode()) {
    await run('DELETE FROM email_verifications WHERE token_hash = ?', [sha(token)]);
    return { ok: false, field: 'email', error: 'இந்த மின்னஞ்சலுக்குக் குறியீடு அனுப்ப முடியவில்லை. முகவரியைச் சரிபார்க்கவும்.' };
  }
  await setCookie(token);
  return { ok: true };
}

export async function pendingInfo() {
  const p = await pendingRow();
  if (!p) return null;
  return { email: p.row.email, masked: maskEmail(p.row.email), devCode: p.row.dev_code, resendIn: Math.max(0, Math.ceil((p.row.last_sent_at + COOLDOWN - Date.now()) / 1000)), next: p.row.next, sendsLeft: MAX_SENDS - p.row.sends };
}

export async function verifyCode(code: string): Promise<{ ok: true; next: string } | { ok: false; error: string; expired?: boolean }> {
  const p = await pendingRow();
  if (!p) return { ok: false, expired: true, error: 'குறியீட்டின் நேரம் முடிந்துவிட்டது. மீண்டும் பதிவு செய்யவும்.' };
  const { row, token } = p;
  if (row.attempts >= MAX_ATTEMPTS) {
    await run('DELETE FROM email_verifications WHERE id = ?', [row.id]);
    return { ok: false, expired: true, error: 'பல தவறான முயற்சிகள். மீண்டும் பதிவு செய்யவும்.' };
  }
  const given = Buffer.from(codeHash(token, code.replace(/\D/g, '')));
  const want = Buffer.from(row.code_hash);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    await run('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    return { ok: false, error: `குறியீடு தவறு. இன்னும் ${MAX_ATTEMPTS - row.attempts - 1} முயற்சிகள் உள்ளன.` };
  }
  if ((await get('SELECT id FROM customers WHERE email = ? OR phone = ?', [row.email, row.phone]))) {
    await run('DELETE FROM email_verifications WHERE id = ?', [row.id]);
    return { ok: false, expired: true, error: 'இந்த மின்னஞ்சல் அல்லது கைபேசி எண்ணில் கணக்கு ஏற்கனவே உள்ளது. உள்நுழையவும்.' };
  }
  const r = await run('INSERT INTO customers(name,phone,email,password_hash,email_verified) VALUES(?,?,?,?,1)', [row.name, row.phone, row.email, row.password_hash]);
  await run('DELETE FROM email_verifications WHERE id = ?', [row.id]);
  (await cookies()).delete(COOKIE);
  await start(r.lastInsertRowid);
  return { ok: true, next: row.next };
}

export async function resendCode(): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = await pendingRow();
  if (!p) return { ok: false, error: 'நேரம் முடிந்துவிட்டது. மீண்டும் பதிவு செய்யவும்.' };
  const { row, token } = p;
  const wait = Math.ceil((row.last_sent_at + COOLDOWN - Date.now()) / 1000);
  if (wait > 0) return { ok: false, error: `${wait} விநாடி கழித்து மீண்டும் கேட்கலாம்.` };
  if (row.sends >= MAX_SENDS) return { ok: false, error: 'அதிகபட்சம் 5 முறை அனுப்பப்பட்டுவிட்டது. மீண்டும் பதிவு செய்யவும்.' };
  const code = newCode();
  await run('UPDATE email_verifications SET code_hash=?, dev_code=?, attempts=0, sends=sends+1, last_sent_at=?, expires_at=? WHERE id=?', [codeHash(token, code), showCode() ? code : '', Date.now(), Date.now() + TTL, row.id]);
  const mailed = await sendVerificationEmail(row.email, row.name, code);
  if (!mailed && !showCode()) return { ok: false, error: 'மின்னஞ்சல் அனுப்ப முடியவில்லை. பிறகு முயலவும்.' };
  return { ok: true };
}

export async function cancelSignup() {
  const p = await pendingRow();
  if (p) await run('DELETE FROM email_verifications WHERE id = ?', [p.row.id]);
  (await cookies()).delete(COOKIE);
}
