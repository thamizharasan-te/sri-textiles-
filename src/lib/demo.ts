import bcrypt from 'bcryptjs';
import type { Q } from './db';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from './demo-catalog';

// மாதிரித் தரவு: உள்ளூர் `npm run seed` மற்றும் Vercel டெமோ முறையில் (தானாக) பயன்படும்.
// படங்கள் public/demo-இல் உள்ள நிலையான கோப்புகள் (வரையப்பட்டவை; உண்மைப் புகைப்படங்கள் அல்ல).

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
  if (opts.admin) {
    const has = (await q.get<{ n: number }>('SELECT COUNT(*) n FROM admins'))!.n;
    if (!has) await q.run('INSERT INTO admins(username,password_hash) VALUES(?,?)', [DEMO_ADMIN_USER, bcrypt.hashSync(demoAdminPassword(), 10)]);
  }
  const count = (await q.get<{ n: number }>('SELECT COUNT(*) n FROM products'))!.n;
  if (count > 0 && !opts.force) return false;
  for (const [k, v] of Object.entries(SETTINGS)) await q.run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, v]);
  await q.run('DELETE FROM categories');
  const catIds: number[] = [];
  for (const [i, name] of DEMO_CATEGORIES.entries()) catIds.push((await q.run('INSERT INTO categories(name,sort) VALUES(?,?)', [name, i + 1])).lastInsertRowid);
  for (const p of DEMO_PRODUCTS) {
    const pid = (
      await q.run('INSERT INTO products(name,description,category_id,price,mrp,fabric,color,gst_rate,featured,size_info) VALUES(?,?,?,?,?,?,?,?,?,?)', [
        p.name, p.desc, catIds[p.cat], p.price, p.mrp, p.fabric, p.color, p.gst, p.featured ? 1 : 0, 'அளவுகளை உங்கள் உடலளவுடன் ஒப்பிடுங்கள். சந்தேகம் இருந்தால் கடையை அழைக்கவும்.',
      ])
    ).lastInsertRowid;
    for (const [n, s] of ['a', 'b'].entries()) await q.run('INSERT INTO product_images(product_id,file,sort) VALUES(?,?,?)', [pid, `demo/${p.id}-${s}`, n]);
    for (const [i, [l, det, st]] of p.sizes.entries()) await q.run('INSERT INTO product_sizes(product_id,label,detail,stock,sort) VALUES(?,?,?,?,?)', [pid, l, det, st, i]);
  }
  return true;
}
