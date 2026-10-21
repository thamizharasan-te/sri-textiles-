import { all, tx } from './db';

export const SETTING_DEFAULTS = {
  shop_name: 'ஸ்ரீ டெக்ஸ்டைல்ஸ்',
  shop_name_en: 'Sri Textiles',
  tagline: 'அனைத்து உடைகளும் இங்கு விற்கப்படும்',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  gstin: '',
  delivery_fee: '40',
  free_delivery_above: '2000',
  delivery_pincodes: '',
  hero_title: 'பட்டின் பெருமை, பாரம்பரியத்தின் அழகு',
  hero_subtitle: 'புடவைகள், சுடிதார், குர்தி, குழந்தைகள் & ஆண்கள் உடைகள் — அனைத்து உடைகளும் இங்கு விற்கப்படும். உங்கள் ஊரிலேயே, உங்கள் வீடு தேடி.',
  hours: 'காலை 9:30 – இரவு 8:30',
  map_link: '',
  // English (ஆங்கிலம்) — தளத்தை English-க்கு மாற்றினால் இவை காட்டப்படும்
  tagline_en: 'Every kind of clothing, all sold here',
  hero_title_en: 'The pride of silk, the beauty of tradition',
  hero_subtitle_en: 'Sarees, salwars, kurtis, kids’ wear and menswear — everything in one place. Delivered to your door, right in your town.',
  hours_en: '9:30 AM – 8:30 PM',
  address_en: '',
  city_en: '',
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in SETTING_DEFAULTS) out[r.key] = r.value;
  return out as Settings;
}

export async function saveSettings(values: Partial<Settings>) {
  await tx(async (q) => {
    for (const [k, v] of Object.entries(values))
      if (k in SETTING_DEFAULTS) await q.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, String(v ?? '')]);
  });
}

export function deliveryFee(s: Settings, subtotal: number) {
  const fee = parseInt(s.delivery_fee) || 0;
  const free = parseInt(s.free_delivery_above) || 0;
  if (free > 0 && subtotal >= free) return 0;
  return fee;
}

export function waLink(s: Settings, text = '') {
  const num = s.whatsapp.replace(/\D/g, '');
  if (!num) return '';
  const full = num.length === 10 ? '91' + num : num;
  return `https://wa.me/${full}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

/** English-ஆக இருந்தால் *_en புலங்களை (இருந்தால்) பயன்படுத்தும் */
export function localizeSettings(s: Settings, lang: 'ta' | 'en'): Settings {
  if (lang !== 'en') return s;
  const o = { ...s };
  if (s.shop_name_en) o.shop_name = s.shop_name_en;
  for (const k of ['tagline', 'hero_title', 'hero_subtitle', 'hours', 'address', 'city'] as const) {
    const en = s[`${k}_en` as SettingKey];
    if (en) o[k] = en;
  }
  return o;
}
