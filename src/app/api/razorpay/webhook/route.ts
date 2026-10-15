import { markPaid, getOrderById } from '@/lib/orders';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendOrderEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.text();
  if (!verifyWebhookSignature(body, req.headers.get('x-razorpay-signature') || '')) return new Response('bad signature', { status: 400 });
  try {
    const ev = JSON.parse(body);
    if (ev.event === 'payment.captured' || ev.event === 'order.paid') {
      const pay = ev.payload?.payment?.entity;
      if (pay?.order_id && pay?.id) {
        const r = markPaid(String(pay.order_id), String(pay.id));
        if (r?.first) await sendOrderEmail(getOrderById(r.orderId)!);
      }
    }
  } catch (e) {
    console.error('webhook பிழை', e);
  }
  return new Response('ok');
}
