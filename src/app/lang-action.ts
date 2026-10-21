'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isLang } from '@/lib/i18n';

export async function setLangAction(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set('st_lang', lang, { path: '/', maxAge: 365 * 86400, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  revalidatePath('/', 'layout');
}
