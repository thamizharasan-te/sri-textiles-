'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { useT } from '@/components/LangProvider';

type Size = { label: string; detail: string; stock: number };

export default function ProductBuy({ product, sizes, sizeInfo }: { product: { id: number; name: string; nameEn?: string; price: number; image: string | null }; sizes: Size[]; sizeInfo: string }) {
  const t = useT();
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [guide, setGuide] = useState(false);
  const cart = useCart();
  const router = useRouter();
  const sel = sizes.find((s) => s.label === size);
  const available = sizes.some((s) => s.stock > 0);

  function go(buyNow: boolean) {
    if (!sel) {
      setMsg(t("முதலில் அளவைத் தேர்ந்தெடுக்கவும்"));
      document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (sel.stock <= 0) { setMsg(t("இந்த அளவு தீர்ந்துவிட்டது")); return; }
    cart.add({ productId: product.id, size: sel.label, qty, name: product.name, nameEn: product.nameEn, price: product.price, image: product.image, max: sel.stock });
    if (buyNow) router.push('/cart');
    else setMsg(t("கூடையில் சேர்க்கப்பட்டது ✓"));
  }

  if (!available) return <div className="rounded-lg bg-red-50 p-4 font-semibold text-red-700">{t("இந்த உடை தற்போது விற்றுத் தீர்ந்துவிட்டது.")}</div>;

  return (
    <div id="size-picker">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{t("அளவைத் தேர்ந்தெடுக்கவும்")} <span className="text-red-600">*</span></span>
        <button type="button" onClick={() => setGuide((g) => !g)} className="text-sm text-maroon underline">{t("அளவு விவரங்கள்")}</button>
      </div>
      {guide && (
        <div className="mt-2 rounded-lg border border-gold bg-gold-pale p-3 text-sm">
          {sizeInfo && <p className="whitespace-pre-line">{t(sizeInfo)}</p>}
          <ul className="mt-1 space-y-0.5">{sizes.filter((s) => s.detail).map((s) => <li key={s.label}><b>{t(s.label)}:</b> {t(s.detail)}</li>)}</ul>
          <p className="mt-2 text-xs text-stone-600">{t("சந்தேகம் இருந்தால் வாங்கும் முன் கடைக்கு அழைத்துக் கேளுங்கள். பணம் திரும்பத் தரப்படாது; அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும்.")}</p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("அளவு")}>
        {sizes.map((s) => (
          <button key={s.label} type="button" role="radio" aria-checked={size === s.label} disabled={s.stock <= 0}
            onClick={() => { setSize(s.label); setMsg(''); setQty(1); }}
            className={`min-h-[46px] min-w-[56px] rounded-lg border px-4 py-2 font-semibold transition ${size === s.label ? 'border-maroon bg-maroon text-white' : 'border-stone-300 bg-white hover:border-maroon'} disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 disabled:line-through`}>
            {t(s.label)}
          </button>
        ))}
      </div>
      {sel && <p className="mt-2 text-sm">{sel.detail && <span>{t(sel.detail)} · </span>}<span className={sel.stock <= 3 ? 'font-semibold text-red-700' : 'text-green-700'}>{sel.stock <= 3 ? t('இன்னும் {n} மட்டுமே உள்ளது!', { n: sel.stock }) : t("கையிருப்பில் உள்ளது")}</span></p>}

      <div className="mt-4 flex items-center gap-3">
        <span className="font-semibold">{t("எண்ணிக்கை")}</span>
        <div className="flex items-center rounded-lg border border-stone-300 bg-white">
          <button type="button" className="h-11 w-11 text-xl" onClick={() => setQty(Math.max(1, qty - 1))} aria-label={t("குறை")}>−</button>
          <span className="w-8 text-center">{qty}</span>
          <button type="button" className="h-11 w-11 text-xl" onClick={() => setQty(Math.min(sel?.stock ?? 10, 10, qty + 1))} aria-label={t("கூட்டு")}>+</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="btn-outline" onClick={() => go(false)}>{t("கூடையில் சேர்")}</button>
        <button className="btn-primary" onClick={() => go(true)}>{t("இப்போதே வாங்கு")}</button>
      </div>
      {msg && <p role="status" className={`mt-3 text-sm font-medium ${msg.includes('✓') ? 'text-green-700' : 'text-red-700'}`}>{msg}</p>}

      {/* தொலைபேசி: கீழ்ப் பட்டிக்கு மேலே நிலையான வாங்கும் பட்டி */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-stone-300 bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <div className="leading-tight"><div className="text-lg font-bold text-maroon">₹{product.price.toLocaleString('en-IN')}</div><div className="text-[11px] text-stone-500">{sel ? t('அளவு {s}', { s: t(sel.label) }) : t("அளவைத் தேர்ந்தெடு")}</div></div>
        <button className="btn-primary ml-auto flex-1 !min-h-[48px]" onClick={() => go(false)}>{sel ? t("கூடையில் சேர்") : t("அளவைத் தேர்ந்தெடு")}</button>
      </div>
    </div>
  );
}
