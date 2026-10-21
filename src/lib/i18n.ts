// தமிழ் / English: தமிழ்ச் சொல்லே "திறவுகோல்". t('தமிழ்') → ta எனில் அதே சொல், en எனில் i18n-en.ts-இல் உள்ள ஆங்கிலம்.
// இடமாற்றுகள்: t('இன்னும் {n} உள்ளது', { n: 3 }). கண்டுபிடிக்க முடியாவிட்டால் தமிழே காட்டும் (தளம் உடையாது).
import { EN, PATTERNS } from './i18n-en';

export type Lang = 'ta' | 'en';
export const LANG_COOKIE = 'st_lang';
/** இயல்புநிலை மொழி: முதலில் English; தமிழ் வேண்டுபவர் மாற்றிக்கொள்ளலாம் */
export const DEFAULT_LANG: Lang = 'en';
export const isLang = (v: unknown): v is Lang => v === 'ta' || v === 'en';
export type Params = Record<string, string | number>;
export type TFn = (text: string, params?: Params) => string;

const fill = (s: string, p?: Params) => (p ? s.replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : s);

export function translate(lang: Lang, text: string, params?: Params): string {
  if (lang === 'ta' || !text) return fill(text, params);
  const hit = EN[text];
  if (hit !== undefined) return fill(hit, params);
  for (const [re, tpl] of PATTERNS) {
    const m = re.exec(text);
    if (m) return fill(tpl.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? ''), params);
  }
  return fill(text, params);
}

export const makeT = (lang: Lang): TFn => (text, params) => translate(lang, text, params);

/** தரவுத்தளத்தில் உள்ள உள்ளடக்கம் (பெயர், விளக்கம்): ஆங்கிலப் புலம் இருந்தால் அதை, இல்லையெனில் தமிழை */
export const loc = (lang: Lang, ta: string, en?: string | null) => (lang === 'en' && en ? en : ta);

export const dateLocale = (lang: Lang) => (lang === 'en' ? 'en-IN' : 'ta-IN');
