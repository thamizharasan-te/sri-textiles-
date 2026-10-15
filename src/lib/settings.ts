import { all, tx } from './db';

export const SETTING_DEFAULTS = {
  shop_name: 'ஸ்ரீ டெக்ஸ்டைல்ஸ்',
  shop_name_en: 'Sri Textiles',
  tagline: 'பாரம்பரியப் புடவைகளும் புதிய ஆடைகளும்',
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
  hero_subtitle: 'கைத்தறிப் புடவைகள் முதல் புதிய தைத்த ஆடைகள் வரை — உங்கள் ஊரிலேயே, உங்கள் வீடு தேடி.',
  hours: 'காலை 9:30 – இரவு 8:30',
  map_link: '',
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
