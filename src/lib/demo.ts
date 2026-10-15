import bcrypt from 'bcryptjs';
import { saveImageBuffer } from './images';
import type { Q } from './db';

// மாதிரித் தரவு: உள்ளூர் `npm run seed` மற்றும் Vercel டெமோ முறையில் (தானாக) பயன்படும்.
// படங்கள் உண்மையானவை அல்ல (நெசவு வடிவங்கள்) — நிர்வாகத்தில் உண்மைப் படங்களை ஏற்றலாம்.

function art(c1: string, c2: string, c3: string, kind: number) {
  const pat =
    kind === 0
      ? `<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="6" fill="${c3}" opacity=".7"/></pattern>`
      : kind === 1
        ? `<pattern id="p" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="30" fill="${c3}" opacity=".35"/></pattern>`
        : `<pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 5 L55 30 L30 55 L5 30Z" fill="none" stroke="${c3}" stroke-width="3" opacity=".7"/></pattern>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1250"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>${pat}</defs>
  <rect width="1000" height="1250" fill="url(#g)"/><rect width="1000" height="1250" fill="url(#p)"/>
  <rect x="0" y="1060" width="1000" height="120" fill="${c3}" opacity=".85"/><rect x="0" y="1090" width="1000" height="16" fill="${c1}"/></svg>`);
}
const img = async (c1: string, c2: string, c3: string, k: number) => {
  const sharp = (await import('sharp')).default;
  return saveImageBuffer(await sharp(art(c1, c2, c3, k)).png().toBuffer());
};

type S = [string, string, number];
const FREE: S[] = [['ஒரே அளவு', 'நீளம் 5.5 மீ + Blouse piece 0.8 மீ', 3]];
const ADULT: S[] = [['S', 'மார்பு 34 அங்குலம்', 2], ['M', 'மார்பு 36 அங்குலம்', 3], ['L', 'மார்பு 38 அங்குலம்', 3], ['XL', 'மார்பு 40 அங்குலம்', 1]];
const KIDS: S[] = [['2-3 வயது', 'நீளம் 18 அங்குலம்', 2], ['4-5 வயது', 'நீளம் 21 அங்குலம்', 2], ['6-7 வயது', 'நீளம் 24 அங்குலம்', 0]];

const mk = (C: Record<'silk'|'cotton'|'churi'|'kids'|'men', number>): [string, string, number, number | null, number, string, string, S[], string[], number, number][] => [
  ['காஞ்சிபுரம் பட்டுப் புடவை — மரூன்', 'தூய பட்டு, தங்க ஜரிகை பார்டர். திருமணம், விழாக்களுக்கு ஏற்றது.', 8500, 9800, C.silk, 'பட்டு', 'மரூன்', FREE, ['#7a1230', '#a3304f', '#e8c766'], 1, 12],
  ['ஆரணி பட்டுப் புடவை — பச்சை', 'இலகுவான ஆரணி பட்டு, கோவில் பார்டர்.', 5200, null, C.silk, 'பட்டு', 'பச்சை', FREE, ['#0f5132', '#198754', '#e8c766'], 2, 5],
  ['சேலம் பட்டு — நீலம்', 'மென்மையான சேலம் பட்டு.', 3900, 4500, C.silk, 'பட்டு', 'நீலம்', FREE, ['#0b3c7a', '#3b82c4', '#e8c766'], 0, 5],
  ['சில்க் காட்டன் புடவை — மஞ்சள்', 'தினசரி & விழா இரண்டுக்கும் ஏற்ற சில்க் காட்டன்.', 1800, 2200, C.silk, 'சில்க் காட்டன்', 'மஞ்சள்', FREE, ['#d9a400', '#f2c94c', '#7a1230'], 1, 5],
  ['கைத்தறி பருத்திப் புடவை — சிவப்பு', 'கைத்தறி பருத்தி, வெயிலுக்கு இதமானது.', 1200, null, C.cotton, 'பருத்தி', 'சிவப்பு', FREE, ['#b3261e', '#e0584f', '#fbf6ee'], 0, 5],
  ['பருத்திப் புடவை — இளஞ்சிவப்பு', 'அலுவலகத்துக்கு ஏற்ற எளிய பருத்திப் புடவை.', 950, 1200, C.cotton, 'பருத்தி', 'இளஞ்சிவப்பு', FREE, ['#d6336c', '#f783ac', '#fbf6ee'], 1, 5],
  ['பருத்தி குர்தி — ஊதா', 'வசதியான பருத்தி குர்தி, தளர்வான பொருத்தம்.', 799, 999, C.churi, 'பருத்தி', 'ஊதா', ADULT, ['#5f3dc4', '#9775fa', '#fbf6ee'], 2, 5],
  ['அனார்கலி சுடிதார் — பச்சை', 'துப்பட்டாவுடன் முழு செட்.', 1650, null, C.churi, 'ரேயான்', 'பச்சை', ADULT, ['#2b8a3e', '#69db7c', '#fbf6ee'], 1, 5],
  ['பாவாடை சட்டை — சிவப்பு', 'குழந்தைகளுக்கான பட்டுப் பாவாடை.', 1100, 1400, C.kids, 'பட்டு', 'சிவப்பு', KIDS, ['#c92a2a', '#ff8787', '#e8c766'], 0, 5],
  ['ஆண்கள் சட்டை — நீலம்', 'முழுக்கை பருத்திச் சட்டை.', 899, null, C.men, 'பருத்தி', 'நீலம்', ADULT, ['#1c7ed6', '#74c0fc', '#fbf6ee'], 1, 5],
  ['பட்டு வேட்டி சட்டை செட்', 'விழாக்களுக்கான வேட்டி + சட்டை.', 2400, 2800, C.men, 'பட்டு', 'வெள்ளை', [['M', 'சட்டை மார்பு 38', 2], ['L', 'சட்டை மார்பு 40', 2], ['XL', 'சட்டை மார்பு 42', 2]], ['#f1f3f5', '#dee2e6', '#b8860b'], 2, 12],
  ['ஜார்ஜெட் புடவை — கருப்பு', 'பார்ட்டி வேர் ஜார்ஜெட்.', 1500, 1900, C.silk, 'ஜார்ஜெட்', 'கருப்பு', FREE, ['#212529', '#495057', '#e8c766'], 0, 5],
];



const SETTINGS: Record<string, string> = {
  shop_name: 'ஸ்ரீ டெக்ஸ்டைல்ஸ்',
  tagline: 'அனைத்து உடைகளும் இங்கு விற்கப்படும்',
  city: 'உங்கள் ஊர்',
  phone: '9876543210',
};

export const DEMO_ADMIN_USER = 'owner';
export const demoAdminPassword = () => process.env.DEMO_ADMIN_PASSWORD || 'demo12345';

/** மாதிரிக் கடையை நிரப்பும். பொருட்கள் ஏற்கனவே இருந்தால் எதுவும் செய்யாது (force தவிர). */
export async function seedDemo(q: Pick<Q, 'get' | 'run'>, opts: { force?: boolean; admin?: boolean } = {}) {
  const count = (await q.get<{ n: number }>('SELECT COUNT(*) n FROM products'))!.n;
  if (opts.admin) {
    const has = (await q.get<{ n: number }>('SELECT COUNT(*) n FROM admins'))!.n;
    if (!has) await q.run('INSERT INTO admins(username,password_hash) VALUES(?,?)', [DEMO_ADMIN_USER, bcrypt.hashSync(demoAdminPassword(), 10)]);
  }
  if (count > 0 && !opts.force) return false;
  for (const [k, v] of Object.entries(SETTINGS)) await q.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, v]);
  await q.run('DELETE FROM categories');
  const cat = async (n: string, s: number) => (await q.run('INSERT INTO categories(name,sort) VALUES(?,?)', [n, s])).lastInsertRowid;
  const C = { silk: await cat('பட்டுப் புடவைகள்', 1), cotton: await cat('பருத்திப் புடவைகள்', 2), churi: await cat('சுடிதார் & குர்தி', 3), kids: await cat('குழந்தைகள் ஆடைகள்', 4), men: await cat('ஆண்கள் சட்டை & வேட்டி', 5) };
  for (const [name, desc, price, mrp, cid, fabric, color, sizes, [c1, c2, c3], kind, gst] of mk(C)) {
    const pid = (
      await q.run('INSERT INTO products(name,description,category_id,price,mrp,fabric,color,gst_rate,featured,size_info) VALUES(?,?,?,?,?,?,?,?,?,?)', [
        name, desc, cid, price, mrp, fabric, color, gst === 12 ? 5 : gst, price > 3000 ? 1 : 0, 'அளவுகளை உங்கள் உடலளவுடன் ஒப்பிடுங்கள். சந்தேகம் இருந்தால் கடையை அழைக்கவும்.',
      ])
    ).lastInsertRowid;
    // படம் உருவாக்க முடியாவிட்டாலும் பொருள் தெரியட்டும் (placeholder காட்டும்)
    const files = await Promise.all([0, 1].map((n) => img(n ? c2 : c1, n ? c1 : c2, c3, kind).catch((e) => { console.error('மாதிரிப் படம் உருவாக்க முடியவில்லை', e); return null; })));
    for (const [n, f] of files.entries()) if (f) await q.run('INSERT INTO product_images(product_id,file,sort) VALUES(?,?,?)', [pid, f, n]);
    for (const [i, [l, det, st]] of sizes.entries()) await q.run('INSERT INTO product_sizes(product_id,label,detail,stock,sort) VALUES(?,?,?,?,?)', [pid, l, det, st, i]);
  }
  return true;
}
