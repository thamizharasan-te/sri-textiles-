'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { placeOrder, verifyPayment } from '@/app/actions';
import { rupees } from '@/lib/format';

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, f: () => void) => void } } }

function Field({ label, error, type = 'text', ...rest }: { label: string; error?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div><label htmlFor={rest.name}>{label}</label><input id={rest.name} type={type} {...rest} />{error && <p className="err">{error}</p>}</div>
  );
}

type Cust = { name: string; phone: string; email: string; address: string; city: string; pincode: string };

export default function CheckoutForm({ fee, freeAbove, online, city, customer }: { fee: number; freeAbove: number; online: boolean; city: string; customer: Cust | null }) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [pay, setPay] = useState<'cod' | 'razorpay'>('cod');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fe, setFe] = useState<Record<string, string>>({});
  const delivery = freeAbove > 0 && subtotal >= freeAbove ? 0 : fee;

  if (!ready) return <p className="py-10 text-center text-stone-500">ஏற்றுகிறது…</p>;
  if (!items.length) return <div className="py-10 text-center"><p>கூடை காலியாக உள்ளது.</p><Link href="/products" className="btn-primary mt-4">உடைகளைப் பார்க்க</Link></div>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setErr(''); setFe({});
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? '');
    setBusy(true);
    const res = await placeOrder({
      name: g('name'), phone: g('phone').replace(/\D/g, '').slice(-10), email: g('email'), address: g('address'), city: g('city'), pincode: g('pincode'), note: g('note'),
      payment_method: pay, agree: agree as true,
      items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
    });
    if (!res.ok) { setBusy(false); setErr(res.error); setFe(res.fieldErrors || {}); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!res.razorpay) { clear(); router.push(`/order/${res.token}`); return; }
    const rz = res.razorpay;
    const rp = new window.Razorpay!({
      key: rz.keyId, amount: rz.amount, currency: 'INR', order_id: rz.orderId, name: 'Sri Textiles', description: 'ஆர்டர் பணம்',
      prefill: { name: rz.name, contact: rz.phone, email: rz.email },
      theme: { color: '#7a1230' },
      handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const v = await verifyPayment({ token: res.token, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
        if (v.ok) { clear(); router.push(`/order/${res.token}`); }
        else { setBusy(false); setErr('பணம் உறுதி செய்ய முடியவில்லை. பணம் கழிந்திருந்தால் கடையைத் தொடர்பு கொள்ளுங்கள்.'); }
      },
      modal: { ondismiss: () => { setBusy(false); setErr('பணம் செலுத்தல் நிறுத்தப்பட்டது. 30 நிமிடத்துக்குள் மீண்டும் முயலலாம் அல்லது COD தேர்ந்தெடுக்கலாம்; இல்லாவிட்டால் ஆர்டர் தானாக ரத்தாகும்.'); } },
    });
    rp.on('payment.failed', () => setErr('பணம் செலுத்த முடியவில்லை. மீண்டும் முயலவும்.'));
    rp.open();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]" noValidate>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-6">
        {!customer && (
          <div className="rounded-lg border border-gold bg-gold-pale p-3 text-sm">
            கணக்கு இருந்தால் முகவரி தானாக நிரம்பும், ஆர்டர்களையும் பின்னர் பார்க்கலாம். <Link href="/account/login?next=/checkout" className="font-semibold text-maroon underline">உள்நுழை</Link> · <Link href="/account/signup?next=/checkout" className="font-semibold text-maroon underline">புதிய கணக்கு</Link> <span className="text-stone-500">(அல்லது கணக்கின்றி தொடரலாம்)</span>
          </div>
        )}
        {err && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</div>}
        <section className="card space-y-4 p-5">
          <h2 className="!text-lg">டெலிவரி முகவரி</h2>
          <Field error={fe.name} name="name" label="பெயர் *" autoComplete="name" defaultValue={customer?.name} required />
          <Field error={fe.phone} name="phone" label="கைபேசி எண் *" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10 இலக்கம்" defaultValue={customer?.phone} required />
          <Field error={fe.email} name="email" label="மின்னஞ்சல் (ஆர்டர் உறுதிக்கு — விருப்பம்)" type="email" autoComplete="email" defaultValue={customer?.email} />
          <div><label htmlFor="address">முழு முகவரி *</label><textarea id="address" name="address" rows={3} autoComplete="street-address" defaultValue={customer?.address} required />{fe.address && <p className="err">{fe.address}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={fe.city} name="city" label="ஊர் *" defaultValue={customer?.city || city} required />
            <Field error={fe.pincode} name="pincode" label="அஞ்சல் குறியீடு *" inputMode="numeric" maxLength={6} autoComplete="postal-code" defaultValue={customer?.pincode} required />
          </div>
          <div><label htmlFor="note">குறிப்பு (விருப்பம்)</label><input id="note" name="note" maxLength={300} placeholder="எ.கா. மாலை 5 மணிக்குப் பிறகு டெலிவரி" /></div>
        </section>

        <section className="card p-5">
          <h2 className="!text-lg">பணம் செலுத்தும் முறை</h2>
          <div className="mt-3 space-y-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${pay === 'cod' ? 'border-maroon bg-gold-pale' : 'border-stone-300'}`}>
              <input type="radio" name="pay" checked={pay === 'cod'} onChange={() => setPay('cod')} className="mt-1.5" />
              <span><b>பொருள் கிடைத்ததும் பணம் (COD)</b><br /><span className="text-sm text-stone-600">டெலிவரியின் போது பணமாகக் கொடுக்கலாம்</span></span>
            </label>
            {online && (
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${pay === 'razorpay' ? 'border-maroon bg-gold-pale' : 'border-stone-300'}`}>
                <input type="radio" name="pay" checked={pay === 'razorpay'} onChange={() => setPay('razorpay')} className="mt-1.5" />
                <span><b>ஆன்லைன் பணம்</b><br /><span className="text-sm text-stone-600">UPI, அட்டை, நெட் பேங்கிங் (Razorpay)</span></span>
              </label>
            )}
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gold bg-gold-pale p-4 text-sm font-normal">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1.5 h-5 w-5" />
          <span>அளவு விவரங்களைச் சரிபார்த்தேன். <b>பணம் திரும்பத் தரப்படாது; அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும்</b> என்பதை ஏற்கிறேன். (<Link href="/policy" target="_blank" className="underline">கொள்கை</Link>)</span>
        </label>
        {fe.agree && <p className="err">{fe.agree}</p>}
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="!text-lg">ஆர்டர் சுருக்கம்</h2>
        <ul className="mt-3 divide-y text-sm">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="flex justify-between gap-2 py-2"><span>{i.name} <span className="text-stone-500">(அளவு {i.size}) × {i.qty}</span></span><b>{rupees(i.price * i.qty)}</b></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between"><span>பொருட்கள்</span><span>{rupees(subtotal)}</span></div>
        <div className="flex justify-between"><span>டெலிவரி</span><span>{delivery ? rupees(delivery) : 'இலவசம்'}</span></div>
        {freeAbove > 0 && delivery > 0 && <p className="text-xs text-green-700">இன்னும் {rupees(freeAbove - subtotal)} சேர்த்தால் டெலிவரி இலவசம்!</p>}
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-maroon"><span>மொத்தம்</span><span>{rupees(subtotal + delivery)}</span></div>
        <button className="btn-primary mt-4 w-full" disabled={busy || !agree}>{busy ? 'காத்திருக்கவும்…' : pay === 'cod' ? 'ஆர்டரை உறுதி செய்' : 'பணம் செலுத்து'}</button>
        {!agree && <p className="mt-2 text-xs text-stone-500">தொடர மேலே உள்ள கொள்கையை ஏற்கவும்.</p>}
      </aside>
    </form>
  );
}
