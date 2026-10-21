'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { currentCustomer, loginCustomer, logoutCustomer, phoneTaken, safeNext, signupSchema, updateProfile } from '@/lib/customer';
import { cancelSignup, resendCode, startSignup, verifyCode } from '@/lib/verify';
import { getT } from '@/lib/i18n-server';

export type AuthState = { error?: string; fields?: Record<string, string>; ok?: string } | undefined;
const ipOf = async () => (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function signupAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const t = await getT();
  const parsed = signupSchema.safeParse({ name: str(fd, 'name'), phone: str(fd, 'phone').replace(/\D/g, '').slice(-10), email: str(fd, 'email'), password: str(fd, 'password'), confirm: str(fd, 'confirm') });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= t(i.message);
    return { error: t('படிவத்தில் சில தவறுகள் உள்ளன'), fields };
  }
  const r = await startSignup({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, password: parsed.data.password, next: safeNext(str(fd, 'next')) }, await ipOf());
  if (!r.ok) return { error: t(r.error), fields: r.field ? { [r.field]: t(r.error) } : undefined };
  redirect('/account/verify');
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const t = await getT();
  const r = await loginCustomer(str(fd, 'identifier').slice(0, 120), str(fd, 'password').slice(0, 100), await ipOf());
  if (!r.ok) return { error: t(r.error ?? '') };
  redirect(safeNext(str(fd, 'next')));
}

export async function logoutAction() {
  await logoutCustomer();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function verifyAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const t = await getT();
  const code = str(fd, 'code').replace(/\D/g, '');
  if (code.length !== 6) return { error: t('6 இலக்கக் குறியீட்டை உள்ளிடவும்') };
  const r = await verifyCode(code);
  if (!r.ok) return { error: t(r.error), fields: r.expired ? { expired: '1' } : undefined };
  revalidatePath('/', 'layout');
  redirect(safeNext(r.next));
}

export async function resendAction(): Promise<AuthState> {
  const t = await getT();
  const r = await resendCode();
  return r.ok ? { ok: t('புதிய குறியீடு அனுப்பப்பட்டது ✓') } : { error: t(r.error) };
}

export async function cancelSignupAction() {
  await cancelSignup();
  redirect('/account/signup');
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'பெயரை உள்ளிடவும்').max(80),
  phone: z.string().trim().regex(/^([6-9]\d{9})?$/, 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்'),
  address: z.string().trim().max(300),
  city: z.string().trim().max(60),
  pincode: z.string().trim().regex(/^(\d{6})?$/, '6 இலக்க அஞ்சல் குறியீடு'),
});
export async function profileAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const t = await getT();
  const me = await currentCustomer();
  if (!me) redirect('/account/login');
  const p = profileSchema.safeParse({ name: str(fd, 'name'), phone: str(fd, 'phone').replace(/\D/g, '').slice(-10), address: str(fd, 'address'), city: str(fd, 'city'), pincode: str(fd, 'pincode') });
  if (!p.success) return { error: t(p.error.issues[0].message) };
  if (await phoneTaken(p.data.phone, me.id)) return { error: t('இந்த கைபேசி எண் வேறொரு கணக்கில் உள்ளது') };
  await updateProfile(me.id, p.data);
  revalidatePath('/account');
  return { ok: t('சேமிக்கப்பட்டது ✓') };
}
