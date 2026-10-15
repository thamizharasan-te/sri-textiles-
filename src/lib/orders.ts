import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run, tx, type Q } from './db';
import { deliveryFee, getSettings } from './settings';

export type OrderItem = { id: number; order_id: number; product_id: number | null; name: string; size: string; price: number; qty: number; gst_rate: number };
export type Order = {
  id: number; order_no: string; token: string; name: string; phone: string; email: string; address: string; city: string; pincode: string;
  note: string; payment_method: 'cod' | 'razorpay'; payment_status: string; status: string; subtotal: number; delivery_fee: number; total: number;
  rzp_order_id: string | null; rzp_payment_id: string | null; created_at: string;
};
export type OrderFull = Order & { items: OrderItem[]; log: { status: string; at: string }[] };

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'பெயரை உள்ளிடவும்').max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்'),
  email: z.string().trim().max(120).email('சரியான மின்னஞ்சல் முகவரி அல்ல').or(z.literal('')),
  address: z.string().trim().min(8, 'முழு முகவரியை உள்ளிடவும்').max(300),
  city: z.string().trim().min(2, 'ஊரின் பெயரை உள்ளிடவும்').max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, '6 இலக்க அஞ்சல் குறியீட்டை உள்ளிடவும்'),
  note: z.string().trim().max(300).default(''),
  payment_method: z.enum(['cod', 'razorpay']),
  agree: z.literal(true, { error: 'மாற்றுக் கொள்கையை ஏற்க வேண்டும்' }),
  items: z
    .array(z.object({ productId: z.number().int().positive(), size: z.string().min(1).max(30), qty: z.number().int().min(1).max(10) }))
    .min(1, 'கூடை காலியாக உள்ளது')
    .max(30),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export class OrderError extends Error {}

/** விலை, கையிருப்பு எல்லாம் சேவையகத்திலேயே சரிபார்க்கப்படும் (வாடிக்கையாளர் அனுப்பும் விலை நம்பப்படாது). */
export async function createOrder(input: z.output<typeof checkoutSchema>): Promise<{ id: number; token: string }> {
  const settings = await getSettings();
  const allowed = settings.delivery_pincodes.split(',').map((x) => x.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(input.pincode)) {
    throw new OrderError(`மன்னிக்கவும், இந்த அஞ்சல் குறியீட்டுக்கு டெலிவரி இல்லை. (டெலிவரி உள்ள பகுதிகள்: ${allowed.join(', ')})`);
  }
  await expireUnpaidOnline();

  // ஒரே பொருள்+அளவு பல வரிகளில் வந்தால் இணைக்கவும்
  const merged = new Map<string, { productId: number; size: string; qty: number }>();
  for (const it of input.items) {
    const k = `${it.productId}|${it.size}`;
    const cur = merged.get(k);
    merged.set(k, cur ? { ...cur, qty: Math.min(10, cur.qty + it.qty) } : { ...it });
  }

  return tx(async (q) => {
    const lines: { productId: number; name: string; size: string; price: number; qty: number; gst: number }[] = [];
    for (const it of merged.values()) {
      const p = await q.get<{ id: number; name: string; price: number; gst_rate: number; active: number }>('SELECT id, name, price, gst_rate, active FROM products WHERE id = ?', [it.productId]);
      if (!p || !p.active) throw new OrderError('ஒரு பொருள் இப்போது கிடைக்கவில்லை. கூடையைப் புதுப்பிக்கவும்.');
      const upd = await q.run('UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND label = ? AND stock >= ?', [it.qty, p.id, it.size, it.qty]);
      if (upd.changes === 0) throw new OrderError(`"${p.name}" (அளவு ${it.size}) தேவையான எண்ணிக்கையில் கையிருப்பில் இல்லை.`);
      lines.push({ productId: p.id, name: p.name, size: it.size, price: p.price, qty: it.qty, gst: p.gst_rate });
    }
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const fee = deliveryFee(settings, subtotal);
    const token = crypto.randomBytes(12).toString('hex');
    const r = await q.run(
      `INSERT INTO orders(token,name,phone,email,address,city,pincode,note,payment_method,subtotal,delivery_fee,total)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      [token, input.name, input.phone, input.email, input.address, input.city, input.pincode, input.note, input.payment_method, subtotal, fee, subtotal + fee],
    );
    const id = r.lastInsertRowid;
    await q.run('UPDATE orders SET order_no = ? WHERE id = ?', [`ST${1000 + id}`, id]);
    for (const l of lines) await q.run('INSERT INTO order_items(order_id,product_id,name,size,price,qty,gst_rate) VALUES(?,?,?,?,?,?,?)', [id, l.productId, l.name, l.size, l.price, l.qty, l.gst]);
    await q.run('INSERT INTO order_log(order_id,status) VALUES(?,?)', [id, 'new']);
    return { id, token };
  });
}

async function full(o: Order | undefined): Promise<OrderFull | undefined> {
  if (!o) return undefined;
  const [items, log] = await Promise.all([
    all<OrderItem>('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [o.id]),
    all<{ status: string; at: string }>('SELECT status, at FROM order_log WHERE order_id = ? ORDER BY id', [o.id]),
  ]);
  return { ...o, items, log };
}
export const getOrderByToken = async (token: string) => full(await get<Order>('SELECT * FROM orders WHERE token = ?', [token]));
export const getOrderById = async (id: number) => full(await get<Order>('SELECT * FROM orders WHERE id = ?', [id]));
export async function findOrderForTracking(orderNo: string, phone: string) {
  const o = await get<Order>('SELECT * FROM orders WHERE order_no = ? COLLATE NOCASE', [orderNo.trim()]);
  if (!o || o.phone !== phone.replace(/\D/g, '').slice(-10)) return undefined;
  return full(o);
}

async function restock(q: Q, orderId: number) {
  const items = await q.all<{ product_id: number; size: string; qty: number }>('SELECT product_id, size, qty FROM order_items WHERE order_id = ?', [orderId]);
  for (const i of items) await q.run('UPDATE product_sizes SET stock = stock + ? WHERE product_id = ? AND label = ?', [i.qty, i.product_id, i.size]);
}

export async function setStatus(orderId: number, status: string) {
  await tx(async (q) => {
    const o = await q.get<{ status: string }>('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!o || o.status === status) return;
    if (o.status === 'cancelled') throw new OrderError('ரத்து செய்யப்பட்ட ஆர்டரின் நிலையை மாற்ற முடியாது');
    if (status === 'cancelled') await restock(q, orderId);
    await q.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    // COD பணம் கொடுக்கப்பட்டதும் வந்ததாகக் கருதுகிறோம்
    if (status === 'delivered') await q.run("UPDATE orders SET payment_status='paid' WHERE id = ? AND payment_method='cod'", [orderId]);
    await q.run('INSERT INTO order_log(order_id,status) VALUES(?,?)', [orderId, status]);
  });
}

export const attachRazorpayOrder = (orderId: number, rzpOrderId: string) => run('UPDATE orders SET rzp_order_id = ? WHERE id = ?', [rzpOrderId, orderId]);

/** பணம் வந்ததாகக் குறிக்கும். புதிதாகக் குறித்தால் first=true (மின்னஞ்சலை ஒரு முறை மட்டும் அனுப்ப). */
export async function markPaid(rzpOrderId: string, paymentId: string): Promise<{ orderId: number; first: boolean } | null> {
  const o = await get<{ id: number; payment_status: string; status: string }>('SELECT id, payment_status, status FROM orders WHERE rzp_order_id = ?', [rzpOrderId]);
  if (!o) return null;
  if (o.payment_status === 'paid') return { orderId: o.id, first: false };
  if (o.status === 'cancelled') return null; // நேரம் கடந்து ரத்தான ஆர்டர்: கைமுறையாகப் பார்க்க வேண்டும்
  const r = await run("UPDATE orders SET payment_status='paid', rzp_payment_id=? WHERE id=? AND payment_status<>'paid'", [paymentId, o.id]);
  return { orderId: o.id, first: r.changes > 0 };
}

/** 30 நிமிடத்துக்குள் பணம் செலுத்தாத ஆன்லைன் ஆர்டர்களை ரத்து செய்து கையிருப்பை மீட்கும். */
export async function expireUnpaidOnline() {
  const stale = await all<{ id: number }>("SELECT id FROM orders WHERE payment_method='razorpay' AND payment_status='pending' AND status='new' AND created_at < datetime('now','-30 minutes')");
  for (const s of stale) {
    await tx(async (q) => {
      const claimed = await q.run("UPDATE orders SET status='cancelled', payment_status='failed' WHERE id=? AND status='new'", [s.id]);
      if (!claimed.changes) return;
      await restock(q, s.id);
      await q.run("INSERT INTO order_log(order_id,status) VALUES(?, 'cancelled')", [s.id]);
    });
  }
}

export function gstBreakup(items: { price: number; qty: number; gst_rate: number }[], delivery = 0) {
  // விலைகள் GST உள்ளடக்கியவை. வரி = மொத்தம் × r/(100+r)
  const byRate = new Map<number, { gross: number; tax: number; taxable: number }>();
  for (const i of items) {
    const g = byRate.get(i.gst_rate) || { gross: 0, tax: 0, taxable: 0 };
    g.gross += i.price * i.qty;
    byRate.set(i.gst_rate, g);
  }
  for (const [r, g] of byRate) {
    g.tax = Math.round((g.gross * r) / (100 + r));
    g.taxable = g.gross - g.tax;
  }
  return { byRate, delivery };
}

export async function salesSummary() {
  const valid = "status <> 'cancelled' AND NOT (payment_method='razorpay' AND payment_status<>'paid')";
  const q = (cond: string) => get<{ n: number; amt: number }>(`SELECT COUNT(*) n, COALESCE(SUM(total),0) amt FROM orders WHERE ${valid} AND ${cond}`).then((r) => r!);
  const [today, week, month, byStatus, top, lowStock] = await Promise.all([
    q("date(created_at,'+5 hours','+30 minutes') = date('now','+5 hours','+30 minutes')"),
    q("created_at >= datetime('now','-7 days')"),
    q("created_at >= datetime('now','-30 days')"),
    all<{ status: string; n: number }>('SELECT status, COUNT(*) n FROM orders GROUP BY status'),
    all<{ name: string; qty: number; amt: number }>(`SELECT oi.name, SUM(oi.qty) qty, SUM(oi.qty*oi.price) amt FROM order_items oi JOIN orders o ON o.id=oi.order_id
      WHERE o.status <> 'cancelled' AND NOT (o.payment_method='razorpay' AND o.payment_status<>'paid') AND o.created_at >= datetime('now','-30 days')
      GROUP BY oi.name ORDER BY qty DESC LIMIT 5`),
    all<{ id: number; name: string; label: string; stock: number }>(`SELECT p.id, p.name, s.label, s.stock FROM product_sizes s JOIN products p ON p.id=s.product_id
      WHERE p.active=1 AND s.stock <= 2 ORDER BY s.stock, p.name LIMIT 15`),
  ]);
  return { today, week, month, byStatus, top, lowStock };
}
