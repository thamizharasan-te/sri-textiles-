'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { changePassword, login, logout, requireAdmin } from '@/lib/auth';
import { all, get, run, tx } from '@/lib/db';
import { deleteProductImage, isValidImageRef, saveProductImage } from '@/lib/images';
import { OrderError, getOrderById, setStatus } from '@/lib/orders';
import { ORDER_STATUS } from '@/lib/format';
import { SETTING_DEFAULTS, saveSettings, type Settings } from '@/lib/settings';
import { sendOrderEmail } from '@/lib/email';

export type FormState = { error?: string; ok?: string } | undefined;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const r = await login(String(fd.get('username') ?? '').trim().slice(0, 60), String(fd.get('password') ?? '').slice(0, 200), ip);
  if (!r.ok) return { error: r.error };
  redirect('/admin');
}
export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}

// ---------- பொருட்கள் ----------
const productSchema = z.object({
  name: z.string().trim().min(2, 'பொருளின் பெயர் தேவை').max(150),
  description: z.string().trim().max(3000),
  category_id: z.coerce.number().int().positive().nullable(),
  price: z.coerce.number({ error: 'விலையை எண்ணாக உள்ளிடவும்' }).int('முழு எண்ணாக உள்ளிடவும்').min(1, 'விலை தேவை').max(1_000_000),
  mrp: z.coerce.number().int().min(0).max(1_000_000).nullable(),
  fabric: z.string().trim().max(60),
  color: z.string().trim().max(60),
  gst_rate: z.coerce.number().int().refine((x) => [0, 5, 12, 18, 28].includes(x), 'GST விகிதம் தவறு'),
  size_info: z.string().trim().max(1500),
});

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const idRaw = String(fd.get('id') || '');
  const id = idRaw ? parseInt(idRaw) : null;
  const nz = (k: string) => { const v = String(fd.get(k) ?? '').trim(); return v === '' ? null : v; };
  const parsed = productSchema.safeParse({
    name: fd.get('name') ?? '', description: fd.get('description') ?? '', category_id: nz('category_id'), price: fd.get('price'), mrp: nz('mrp'),
    fabric: fd.get('fabric') ?? '', color: fd.get('color') ?? '', gst_rate: fd.get('gst_rate') ?? 5, size_info: fd.get('size_info') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.mrp && v.mrp < v.price) return { error: 'அசல் விலை (MRP) விற்பனை விலையை விடக் குறைவாக இருக்கக் கூடாது' };

  const labels = fd.getAll('size_label').map((x) => String(x).trim());
  const details = fd.getAll('size_detail').map((x) => String(x).trim());
  const stocks = fd.getAll('size_stock').map((x) => parseInt(String(x)));
  const sizes: { label: string; detail: string; stock: number }[] = [];
  for (let i = 0; i < labels.length; i++) {
    if (!labels[i]) continue;
    if (labels[i].length > 30) return { error: 'அளவுப் பெயர் மிக நீளம்' };
    if (!Number.isInteger(stocks[i]) || stocks[i] < 0 || stocks[i] > 100000) return { error: `"${labels[i]}" அளவின் கையிருப்பு சரியான எண்ணாக இருக்க வேண்டும்` };
    if (sizes.some((s) => s.label.toLowerCase() === labels[i].toLowerCase())) return { error: `"${labels[i]}" அளவு இரு முறை உள்ளது` };
    sizes.push({ label: labels[i], detail: (details[i] || '').slice(0, 200), stock: stocks[i] });
  }
  if (!sizes.length) return { error: 'குறைந்தது ஓர் அளவாவது தேவை (புடவை என்றால் "ஒரே அளவு")' };

  // படங்கள்: உலாவி ஒவ்வொன்றாக ஏற்றி (uploadImageAction) அடையாளங்களை அனுப்பும்
  const newImages = fd.getAll('new_image').map((x) => String(x)).filter(isValidImageRef);
  const existing = id ? (await get<{ n: number }>('SELECT COUNT(*) n FROM product_images WHERE product_id=?', [id]))!.n : 0;
  const removeIds = fd.getAll('remove_image').map((x) => parseInt(String(x))).filter(Number.isInteger);
  if (existing - removeIds.length + newImages.length > 8) return { error: 'ஒரு பொருளுக்கு அதிகபட்சம் 8 படங்கள்' };
  if (!id && newImages.length === 0) return { error: 'குறைந்தது ஒரு படத்தையாவது சேர்க்கவும்' };

  const toDelete: string[] = [];
  const featured = fd.get('featured') ? 1 : 0;
  const active = fd.get('active') ? 1 : 0;
  try {
    await tx(async (q) => {
      let pid = id;
      if (id) {
        const r = await q.run(`UPDATE products SET name=?,description=?,category_id=?,price=?,mrp=?,fabric=?,color=?,gst_rate=?,size_info=?,featured=?,active=? WHERE id=?`,
          [v.name, v.description, v.category_id, v.price, v.mrp || null, v.fabric, v.color, v.gst_rate, v.size_info, featured, active, id]);
        if (!r.changes) throw new Error('பொருள் கிடைக்கவில்லை');
      } else {
        const r = await q.run(`INSERT INTO products(name,description,category_id,price,mrp,fabric,color,gst_rate,size_info,featured,active) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
          [v.name, v.description, v.category_id, v.price, v.mrp || null, v.fabric, v.color, v.gst_rate, v.size_info, featured, active]);
        pid = r.lastInsertRowid;
      }
      for (const rid of removeIds) {
        const row = await q.get<{ file: string }>('SELECT file FROM product_images WHERE id=? AND product_id=?', [rid, pid]);
        if (row) { await q.run('DELETE FROM product_images WHERE id=?', [rid]); toDelete.push(row.file); }
      }
      const maxSort = (await q.get<{ m: number }>('SELECT COALESCE(MAX(sort),-1) m FROM product_images WHERE product_id=?', [pid]))!.m;
      for (const [i, f] of newImages.entries()) await q.run('INSERT INTO product_images(product_id,file,sort) VALUES(?,?,?)', [pid, f, maxSort + 1 + i]);
      const main = parseInt(String(fd.get('main_image') || ''));
      if (Number.isInteger(main)) {
        await q.run('UPDATE product_images SET sort = sort + 1 WHERE product_id=?', [pid]);
        await q.run('UPDATE product_images SET sort = 0 WHERE id=? AND product_id=?', [main, pid]);
      }
      // அளவுகள்: இருப்பவற்றைப் புதுப்பி, புதியவற்றைச் சேர், நீக்கப்பட்டவற்றை நீக்கு
      const keep = sizes.map((s) => s.label);
      const cur = await q.all<{ label: string }>('SELECT label FROM product_sizes WHERE product_id=?', [pid]);
      for (const c of cur) if (!keep.includes(c.label)) await q.run('DELETE FROM product_sizes WHERE product_id=? AND label=?', [pid, c.label]);
      for (const [i, s] of sizes.entries())
        await q.run(`INSERT INTO product_sizes(product_id,label,detail,stock,sort) VALUES(?,?,?,?,?)
          ON CONFLICT(product_id,label) DO UPDATE SET detail=excluded.detail, stock=excluded.stock, sort=excluded.sort`, [pid, s.label, s.detail, s.stock, i]);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'சேமிக்க முடியவில்லை' };
  }
  await Promise.all(toDelete.map(deleteProductImage));
  revalidatePath('/', 'layout');
  redirect('/admin/products?saved=1');
}

/** ஒரு படத்தை ஏற்றும் (உலாவி ஏற்கெனவே சுருக்கியிருக்கும், Vercel கோரிக்கை வரம்பு 4.5MB-க்காக). */
export async function uploadImageAction(fd: FormData): Promise<{ id?: string; error?: string }> {
  await requireAdmin();
  const f = fd.get('file');
  if (!(f instanceof File) || f.size === 0) return { error: 'கோப்பு இல்லை' };
  if (f.size > 4 * 1024 * 1024) return { error: 'படம் மிகப் பெரியது (4MB-க்குள் இருக்க வேண்டும்)' };
  try {
    return { id: await saveProductImage(f) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'படம் சேமிக்க முடியவில்லை' };
  }
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const id = parseInt(String(fd.get('id')));
  const imgs = await all<{ file: string }>('SELECT file FROM product_images WHERE product_id=?', [id]);
  await tx(async (q) => {
    await q.run('DELETE FROM product_images WHERE product_id=?', [id]);
    await q.run('DELETE FROM product_sizes WHERE product_id=?', [id]);
    await q.run('DELETE FROM products WHERE id=?', [id]);
  });
  await Promise.all(imgs.map((i) => deleteProductImage(i.file)));
  revalidatePath('/', 'layout');
  redirect('/admin/products');
}
export async function toggleActive(fd: FormData) {
  await requireAdmin();
  await run('UPDATE products SET active = 1 - active WHERE id=?', [parseInt(String(fd.get('id')))]);
  revalidatePath('/', 'layout');
}

// ---------- வகைகள் ----------
export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get('name') ?? '').trim().slice(0, 60);
  const id = parseInt(String(fd.get('id') || ''));
  if (name.length < 2) return;
  if (Number.isInteger(id)) await run('UPDATE categories SET name=? WHERE id=?', [name, id]);
  else await run('INSERT INTO categories(name, sort) VALUES(?, (SELECT COALESCE(MAX(sort),0)+1 FROM categories))', [name]);
  revalidatePath('/', 'layout');
}
export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = parseInt(String(fd.get('id')));
  await tx(async (q) => {
    await q.run('UPDATE products SET category_id = NULL WHERE category_id=?', [id]);
    await q.run('DELETE FROM categories WHERE id=?', [id]);
  });
  revalidatePath('/', 'layout');
}

// ---------- ஆர்டர்கள் ----------
export async function updateOrderStatus(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseInt(String(fd.get('id')));
  const status = String(fd.get('status'));
  if (!(status in ORDER_STATUS)) return { error: 'தவறான நிலை' };
  try {
    await setStatus(id, status);
  } catch (e) {
    return { error: e instanceof OrderError ? e.message : 'மாற்ற முடியவில்லை' };
  }
  revalidatePath(`/admin/orders/${id}`);
  return { ok: 'நிலை மாற்றப்பட்டது ✓' };
}
export async function markCodPaid(fd: FormData) {
  await requireAdmin();
  await run("UPDATE orders SET payment_status='paid' WHERE id=?", [parseInt(String(fd.get('id')))]);
  revalidatePath('/admin/orders');
}
export async function resendEmail(fd: FormData) {
  await requireAdmin();
  const o = await getOrderById(parseInt(String(fd.get('id'))));
  if (o) await sendOrderEmail(o);
}

// ---------- அமைப்புகள் ----------
export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const vals: Partial<Settings> = {};
  for (const k of Object.keys(SETTING_DEFAULTS) as (keyof Settings)[]) {
    if (fd.has(k)) vals[k] = String(fd.get(k) ?? '').trim().slice(0, 500);
  }
  if (vals.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i.test(vals.gstin)) return { error: 'GSTIN வடிவம் தவறு (15 எழுத்துகள்)' };
  if (vals.gstin) vals.gstin = vals.gstin.toUpperCase();
  for (const k of ['delivery_fee', 'free_delivery_above'] as const) if (vals[k] !== undefined && !/^\d{0,6}$/.test(vals[k]!)) return { error: 'கட்டணத்தை எண்ணாக உள்ளிடவும்' };
  if (vals.delivery_pincodes && !/^(\d{6})(\s*,\s*\d{6})*$/.test(vals.delivery_pincodes)) return { error: 'அஞ்சல் குறியீடுகளை 6 இலக்கத்தில், கமா இட்டுப் பிரித்து எழுதவும்' };
  if (vals.whatsapp && !/^\+?\d{10,13}$/.test(vals.whatsapp.replace(/[\s-]/g, ''))) return { error: 'WhatsApp எண் தவறு' };
  if (vals.whatsapp) vals.whatsapp = vals.whatsapp.replace(/[\s-]/g, '');
  await saveSettings(vals);
  revalidatePath('/', 'layout');
  return { ok: 'சேமிக்கப்பட்டது ✓' };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const a = await requireAdmin();
  const cur = String(fd.get('current') ?? '');
  const next = String(fd.get('next') ?? '');
  if (next.length < 10) return { error: 'புதிய கடவுச்சொல் குறைந்தது 10 எழுத்துகள் இருக்க வேண்டும்' };
  if (next !== String(fd.get('confirm') ?? '')) return { error: 'இரு கடவுச்சொற்களும் ஒரே மாதிரி இல்லை' };
  const err = await changePassword(a.id, cur, next);
  return err ? { error: err } : { ok: 'கடவுச்சொல் மாற்றப்பட்டது ✓' };
}
