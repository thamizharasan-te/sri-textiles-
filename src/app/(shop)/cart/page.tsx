'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { rupees } from '@/lib/format';

export default function CartPage() {
  const { items, setQty, remove, subtotal, ready } = useCart();
  if (!ready) return <div className="container-x py-16 text-center text-stone-500">ஏற்றுகிறது…</div>;
  if (!items.length)
    return (
      <div className="container-x py-16 text-center">
        <p className="text-5xl">🛍️</p>
        <h1 className="mt-3 text-2xl font-bold">உங்கள் கூடை காலியாக உள்ளது</h1>
        <Link href="/products" className="btn-primary mt-6">உடைகளைப் பார்க்க</Link>
      </div>
    );
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl md:text-3xl font-bold">உங்கள் கூடை</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="card flex gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image ? `/media/${i.image}-t.webp` : '/placeholder.svg'} alt={i.name} className="h-28 w-22 w-[88px] shrink-0 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <Link href={`/products/${i.productId}`} className="font-semibold hover:underline line-clamp-2">{i.name}</Link>
                <p className="text-sm text-stone-600">அளவு: <b>{i.size}</b></p>
                <p className="font-bold text-maroon">{rupees(i.price)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-stone-300">
                    <button className="h-10 w-10 text-lg" onClick={() => setQty(i.productId, i.size, i.qty - 1)} aria-label="குறை">−</button>
                    <span className="w-8 text-center">{i.qty}</span>
                    <button className="h-10 w-10 text-lg" onClick={() => setQty(i.productId, i.size, i.qty + 1)} aria-label="கூட்டு">+</button>
                  </div>
                  <button onClick={() => remove(i.productId, i.size)} className="text-sm text-red-700 underline">நீக்கு</button>
                </div>
              </div>
              <div className="hidden sm:block font-bold">{rupees(i.price * i.qty)}</div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit p-5">
          <h2 className="!text-lg">ஆர்டர் சுருக்கம்</h2>
          <div className="mt-3 flex justify-between"><span>பொருட்களின் தொகை</span><b>{rupees(subtotal)}</b></div>
          <p className="mt-1 text-xs text-stone-500">டெலிவரி கட்டணம் அடுத்த பக்கத்தில் கணக்கிடப்படும்.</p>
          <Link href="/checkout" className="btn-primary mt-4 w-full">தொடர்க — முகவரி & பணம்</Link>
          <Link href="/products" className="mt-2 block text-center text-sm text-maroon underline">மேலும் வாங்க</Link>
        </aside>
      </div>
    </div>
  );
}
