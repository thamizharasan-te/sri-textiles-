import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
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
export function createOrder(input: z.output<typeof checkoutSchema>): { id: number; token: string } {
  const d = db();
  const settings = getSettings();
  const allowed = settings.delivery_pincodes.split(',').map((x) => x.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(input.pincode)) {
    throw new OrderError(`மன்னிக்கவும், இந்த அஞ்சல் குறியீட்டுக்கு டெலிவரி இல்லை. (டெலிவரி உள்ள பகுதிகள்: ${allowed.join(', ')})`);
  }
  expireUnpaidOnline();

  // ஒரே பொருள்+அளவு பல வரிகளில் வந்தால் இணைக்கவும்
  const merged = new Map<string, { productId: number; size: string; qty: number }>();
  for (const it of input.items) {
    const k = `${it.productId}|${it.size}`;
    const cur = merged.get(k);
    merged.set(k, cur ? { ...cur, qty: Math.min(10, cur.qty + it.qty) } : { ...it });
  }

  const tx = d.transaction(() => {
    const lines: { productId: number; name: string; size: string; price: number; qty: number; gst: number }[] = [];
    for (const it of merged.values()) {
      const p = d.prepare('SELECT id, name, price, gst_rate, active FROM products WHERE id = ?').get(it.productId) as
        | { id: number; name: string; price: number; gst_rate: number; active: number }
        | undefined;
      if (!p || !p.active) throw new OrderError('ஒரு பொருள் இப்போது கிடைக்கவில்லை. கூடையைப் புதுப்பிக்கவும்.');
      const upd = d.prepare('UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND label = ? AND stock >= ?').run(it.qty, p.id, it.size, it.qty);
      if (upd.changes === 0) throw new OrderError(`"${p.name}" (அளவு ${it.size}) தேவையான எண்ணிக்கையில் கையிருப்பில் இல்லை.`);
      lines.push({ productId: p.id, name: p.name, size: it.size, price: p.price, qty: it.qty, gst: p.gst_rate });
    }
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const fee = deliveryFee(settings, subtotal);
    const token = crypto.randomBytes(12).toString('hex');
    const r = d
      .prepare(
        `INSERT INTO orders(token,name,phone,email,address,city,pincode,note,payment_method,subtotal,delivery_fee,total)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(token, input.name, input.phone, input.email, input.address, input.city, input.pincode, input.note, input.payment_method, subtotal, fee, subtotal + fee);
    const id = Number(r.lastInsertRowid);
    d.prepare('UPDATE orders SET order_no = ? WHERE id = ?').run(`ST${1000 + id}`, id);
    const ins = d.prepare('INSERT INTO order_items(order_id,product_id,name,size,price,qty,gst_rate) VALUES(?,?,?,?,?,?,?)');
    for (const l of lines) ins.run(id, l.productId, l.name, l.size, l.price, l.qty, l.gst);
    d.prepare('INSERT INTO order_log(order_id,status) VALUES(?,?)').run(id, 'new');
    return { id, token };
  });
  return tx();
}

export function getOrderByToken(token: string): OrderFull | undefined {
  const o = db().prepare('SELECT * FROM orders WHERE token = ?').get(token) as Order | undefined;
  return o && full(o);
}
export function getOrderById(id: number): OrderFull | undefined {
  const o = db().prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | undefined;
  return o && full(o);
}
export function findOrderForTracking(orderNo: string, phone: string): OrderFull | undefined {
  const o = db().prepare('SELECT * FROM orders WHERE order_no = ? COLLATE NOCASE').get(orderNo.trim()) as Order | undefined;
  if (!o || o.phone !== phone.replace(/\D/g, '').slice(-10)) return undefined;
  return full(o);
}
function full(o: Order): OrderFull {
  const items = db().prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(o.id) as OrderItem[];
  const log = db().prepare('SELECT status, at FROM order_log WHERE order_id = ? ORDER BY id').all(o.id) as { status: string; at: string }[];
  return { ...o, items, log };
}

function restock(orderId: number) {
  const items = db().prepare('SELECT product_id, size, qty FROM order_items WHERE order_id = ?').all(orderId) as { product_id: number; size: string; qty: number }[];
  const up = db().prepare('UPDATE product_sizes SET stock = stock + ? WHERE product_id = ? AND label = ?');
  for (const i of items) up.run(i.qty, i.product_id, i.size);
}

export function setStatus(orderId: number, status: string) {
  const d = db();
  const tx = d.transaction(() => {
    const o = d.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string } | undefined;
    if (!o || o.status === status) return;
    if (o.status === 'cancelled') throw new OrderError('ரத்து செய்யப்பட்ட ஆர்டரின் நிலையை மாற்ற முடியாது');
    if (status === 'cancelled') restock(orderId);
    d.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    // COD பணம் கொடுக்கப்பட்டதும் வந்ததாகக் கருதுகிறோம்
    if (status === 'delivered') d.prepare("UPDATE orders SET payment_status='paid' WHERE id = ? AND payment_method='cod'").run(orderId);
    d.prepare('INSERT INTO order_log(order_id,status) VALUES(?,?)').run(orderId, status);
  });
  tx();
}

export function attachRazorpayOrder(orderId: number, rzpOrderId: string) {
  db().prepare('UPDATE orders SET rzp_order_id = ? WHERE id = ?').run(rzpOrderId, orderId);
}

/** பணம் வந்ததாகக் குறிக்கும். புதிதாகக் குறித்தால் true (மின்னஞ்சலை ஒரு முறை மட்டும் அனுப்ப). */
export function markPaid(rzpOrderId: string, paymentId: string): { orderId: number; first: boolean } | null {
  const o = db().prepare('SELECT id, payment_status, status FROM orders WHERE rzp_order_id = ?').get(rzpOrderId) as
    | { id: number; payment_status: string; status: string }
    | undefined;
  if (!o) return null;
  if (o.payment_status === 'paid') return { orderId: o.id, first: false };
  if (o.status === 'cancelled') return null; // நேரம் கடந்து ரத்தான ஆர்டர்: கைமுறையாகப் பார்க்க வேண்டும்
  db().prepare("UPDATE orders SET payment_status='paid', rzp_payment_id=? WHERE id=?").run(paymentId, o.id);
  return { orderId: o.id, first: true };
}

/** 30 நிமிடத்துக்குள் பணம் செலுத்தாத ஆன்லைன் ஆர்டர்களை ரத்து செய்து கையிருப்பை மீட்கும். */
export function expireUnpaidOnline() {
  const d = db();
  const stale = d
    .prepare("SELECT id FROM orders WHERE payment_method='razorpay' AND payment_status='pending' AND status='new' AND created_at < datetime('now','-30 minutes')")
    .all() as { id: number }[];
  for (const s of stale) {
    d.transaction(() => {
      restock(s.id);
      d.prepare("UPDATE orders SET status='cancelled', payment_status='failed' WHERE id=?").run(s.id);
      d.prepare("INSERT INTO order_log(order_id,status) VALUES(?, 'cancelled')").run(s.id);
    })();
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

export function salesSummary() {
  const d = db();
  const q = (sql: string) => d.prepare(sql).get() as { n: number; amt: number };
  const valid = "status <> 'cancelled' AND NOT (payment_method='razorpay' AND payment_status<>'paid')";
  return {
    today: q(`SELECT COUNT(*) n, COALESCE(SUM(total),0) amt FROM orders WHERE ${valid} AND date(created_at,'+5 hours','+30 minutes') = date('now','+5 hours','+30 minutes')`),
    week: q(`SELECT COUNT(*) n, COALESCE(SUM(total),0) amt FROM orders WHERE ${valid} AND created_at >= datetime('now','-7 days')`),
    month: q(`SELECT COUNT(*) n, COALESCE(SUM(total),0) amt FROM orders WHERE ${valid} AND created_at >= datetime('now','-30 days')`),
    byStatus: d.prepare("SELECT status, COUNT(*) n FROM orders GROUP BY status").all() as { status: string; n: number }[],
    top: d.prepare(`SELECT oi.name, SUM(oi.qty) qty, SUM(oi.qty*oi.price) amt FROM order_items oi JOIN orders o ON o.id=oi.order_id
      WHERE o.status <> 'cancelled' AND NOT (o.payment_method='razorpay' AND o.payment_status<>'paid') AND o.created_at >= datetime('now','-30 days')
      GROUP BY oi.name ORDER BY qty DESC LIMIT 5`).all() as { name: string; qty: number; amt: number }[],
    lowStock: d.prepare(`SELECT p.id, p.name, s.label, s.stock FROM product_sizes s JOIN products p ON p.id=s.product_id
      WHERE p.active=1 AND s.stock <= 2 ORDER BY s.stock, p.name LIMIT 15`).all() as { id: number; name: string; label: string; stock: number }[],
  };
}
