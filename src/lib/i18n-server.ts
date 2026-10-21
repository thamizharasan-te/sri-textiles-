import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { isLang, makeT, type Lang, type TFn } from './i18n';
import { getSettings, localizeSettings } from './settings';

/** தற்போதைய மொழி (cookie): இயல்புநிலை தமிழ் */
export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get('st_lang')?.value;
  return isLang(v) ? v : 'ta';
});

export async function getT(): Promise<TFn> {
  return makeT(await getLang());
}

/** தற்போதைய மொழிக்கேற்ப கடை அமைப்புகள் (பெயர், வரி, முகவரி…) */
export async function getLocalizedSettings() {
  const [s, lang] = await Promise.all([getSettings(), getLang()]);
  return localizeSettings(s, lang);
}
