'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { currentCustomer, loginCustomer, logoutCustomer, safeNext, signup, signupSchema, updateProfile } from '@/lib/customer';

export type AuthState = { error?: string; fields?: Record<string, string>; ok?: string } | undefined;
const ipOf = async () => (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function signupAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({ name: str(fd, 'name'), phone: str(fd, 'phone').replace(/\D/g, '').slice(-10), email: str(fd, 'email'), password: str(fd, 'password'), confirm: str(fd, 'confirm') });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { error: 'படிவத்தில் சில தவறுகள் உள்ளன', fields };
  }
  const r = await signup(parsed.data);
  if (!r.ok) return { error: r.error, fields: r.field ? { [r.field]: r.error } : undefined };
  redirect(safeNext(str(fd, 'next')));
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const phone = str(fd, 'phone').replace(/\D/g, '').slice(-10);
  const r = await loginCustomer(phone, str(fd, 'password').slice(0, 100), await ipOf());
  if (!r.ok) return { error: r.error };
  redirect(safeNext(str(fd, 'next')));
}

export async function logoutAction() {
  await logoutCustomer();
  revalidatePath('/', 'layout');
  redirect('/');
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'பெயரை உள்ளிடவும்').max(80),
  email: z.string().trim().max(120).email('சரியான மின்னஞ்சல் முகவரி அல்ல').or(z.literal('')),
  address: z.string().trim().max(300),
  city: z.string().trim().max(60),
  pincode: z.string().trim().regex(/^(\d{6})?$/, '6 இலக்க அஞ்சல் குறியீடு'),
});
export async function profileAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const me = await currentCustomer();
  if (!me) redirect('/account/login');
  const p = profileSchema.safeParse({ name: str(fd, 'name'), email: str(fd, 'email'), address: str(fd, 'address'), city: str(fd, 'city'), pincode: str(fd, 'pincode') });
  if (!p.success) return { error: p.error.issues[0].message };
  await updateProfile(me.id, p.data);
  revalidatePath('/account');
  return { ok: 'சேமிக்கப்பட்டது ✓' };
}
