'use server';
import { checkoutSchema, createOrder, OrderError, attachRazorpayOrder, getOrderById, getOrderByToken, markPaid, setStatus, type CheckoutInput } from '@/lib/orders';
import { createRazorpayOrder, razorpayEnabled, verifyPaymentSignature } from '@/lib/razorpay';
import { sendOrderEmail } from '@/lib/email';

export type PlaceResult =
  | { ok: true; token: string; razorpay?: { keyId: string; orderId: string; amount: number; name: string; phone: string; email: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function placeOrder(raw: CheckoutInput): Promise<PlaceResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: 'படிவத்தில் சில தவறுகள் உள்ளன', fieldErrors };
  }
  const input = parsed.data;
  if (input.payment_method === 'razorpay' && !razorpayEnabled()) return { ok: false, error: 'ஆன்லைன் பணம் தற்போது கிடைக்கவில்லை. COD தேர்ந்தெடுக்கவும்.' };
  let created;
  try {
    created = await createOrder(input);
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: 'ஆர்டர் செய்ய முடியவில்லை. மீண்டும் முயலவும்.' };
  }
  const order = (await getOrderById(created.id))!;
  if (input.payment_method === 'razorpay') {
    try {
      const rid = await createRazorpayOrder(order.total, order.order_no);
      await attachRazorpayOrder(order.id, rid);
      return { ok: true, token: order.token, razorpay: { keyId: process.env.RAZORPAY_KEY_ID!, orderId: rid, amount: order.total * 100, name: order.name, phone: order.phone, email: order.email } };
    } catch (e) {
      console.error('Razorpay பிழை', e);
      await setStatus(order.id, 'cancelled');
      return { ok: false, error: 'ஆன்லைன் பணம் தொடங்க முடியவில்லை. COD முயலவும் அல்லது பிறகு முயலவும்.' };
    }
  }
  await sendOrderEmail(order);
  return { ok: true, token: order.token };
}

export async function verifyPayment(a: { token: string; orderId: string; paymentId: string; signature: string }): Promise<{ ok: boolean }> {
  const o = await getOrderByToken(String(a.token));
  if (!o || o.rzp_order_id !== a.orderId) return { ok: false };
  if (!verifyPaymentSignature(a.orderId, a.paymentId, a.signature)) return { ok: false };
  const r = await markPaid(a.orderId, a.paymentId);
  if (r?.first) await sendOrderEmail((await getOrderById(r.orderId))!);
  return { ok: !!r };
}
