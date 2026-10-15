import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/orders';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, formatDate, rupees } from '@/lib/format';
import StatusForm from '@/components/admin/StatusForm';
import { markCodPaid, resendEmail } from '../../../actions';

export const metadata = { title: 'ஆர்டர் விவரம்' };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id);
  const o = Number.isNaN(id) ? undefined : await getOrderById(id);
  if (!o) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/orders" className="text-sm underline">← ஆர்டர்கள்</Link>
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-bold">ஆர்டர் {o.order_no}</h1><span className="rounded-full bg-gold-pale px-4 py-1 font-semibold">{ORDER_STATUS[o.status]}</span></div>
      <p className="text-sm text-stone-600">{formatDate(o.created_at)}</p>
      <div className="card p-5"><StatusForm id={o.id} status={o.status} /></div>
      <div className="card p-5 text-sm">
        <h2 className="!text-lg">வாடிக்கையாளர்</h2>
        <p className="mt-1"><b>{o.name}</b> · <a className="text-maroon underline" href={`tel:${o.phone}`}>{o.phone}</a>{o.email && <> · {o.email}</>}</p>
        <p>{o.address}, {o.city} - {o.pincode}</p>
        {o.note && <p className="mt-1 rounded bg-yellow-50 p-2">குறிப்பு: {o.note}</p>}
      </div>
      <div className="card p-5">
        <h2 className="!text-lg">பொருட்கள்</h2>
        <ul className="mt-2 divide-y text-sm">{o.items.map((i) => (<li key={i.id} className="flex justify-between gap-2 py-2"><span>{i.name} — அளவு <b>{i.size}</b> × {i.qty}</span><b>{rupees(i.price * i.qty)}</b></li>))}</ul>
        <div className="mt-2 flex justify-between text-sm"><span>டெலிவரி</span><span>{o.delivery_fee ? rupees(o.delivery_fee) : 'இலவசம்'}</span></div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold text-maroon"><span>மொத்தம்</span><span>{rupees(o.total)}</span></div>
        <p className="mt-2 text-sm">{PAYMENT_METHOD[o.payment_method]} — <b>{PAYMENT_STATUS[o.payment_status]}</b>{o.rzp_payment_id && <span className="text-xs text-stone-500"> ({o.rzp_payment_id})</span>}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/orders/${o.id}/invoice`} className="btn-primary">GST ரசீது / அச்சிடு</Link>
        {o.payment_method === 'cod' && o.payment_status !== 'paid' && o.status !== 'cancelled' && (<form action={markCodPaid}><input type="hidden" name="id" value={o.id} /><button className="btn-outline">பணம் பெறப்பட்டது எனக் குறி</button></form>)}
        {o.email && <form action={resendEmail}><input type="hidden" name="id" value={o.id} /><button className="btn-outline">மின்னஞ்சல் மீண்டும் அனுப்பு</button></form>}
      </div>
      <div className="card p-5 text-sm"><h2 className="!text-lg">நிலை வரலாறு</h2><ul className="mt-2 space-y-1">{o.log.map((l, n) => (<li key={n}>{formatDate(l.at)} — {ORDER_STATUS[l.status]}</li>))}</ul></div>
    </div>
  );
}
