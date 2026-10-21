import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, STATUS_FLOW, formatDate, rupees } from '@/lib/format';
import type { OrderFull } from '@/lib/orders';
import { getT } from '@/lib/i18n-server';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';

export default async function OrderView({ o, showThanks = true }: { o: OrderFull; showThanks?: boolean }) {
  const t = await getT();
  const lang = await getLang();
  const cancelled = o.status === 'cancelled';
  const idx = STATUS_FLOW.indexOf(o.status as (typeof STATUS_FLOW)[number]);
  const awaitingPay = o.payment_method === 'razorpay' && o.payment_status !== 'paid' && !cancelled;
  return (
    <>
      {showThanks && !cancelled && !awaitingPay && (
        <div className="rounded-xl bg-green-50 p-5 text-center"><p className="text-3xl">🎉</p><h1 className="mt-1 text-2xl font-bold !text-green-800">{t("நன்றி, {name}! உங்கள் ஆர்டர் பதிவாகிவிட்டது", { name: o.name })}</h1></div>
      )}
      <div className="card mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-sm text-stone-500">{t("ஆர்டர் எண்")}</p><p data-testid="order-no" className="text-xl font-bold text-maroon">{o.order_no}</p></div>
          <span className={`rounded-full px-4 py-1 text-sm font-semibold ${cancelled ? 'bg-red-100 text-red-800' : 'bg-gold-pale text-maroon-dark'}`}>{t(ORDER_STATUS[o.status])}</span>
        </div>
        <p className="mt-1 text-sm text-stone-600">{formatDate(o.created_at, lang)}</p>
        {awaitingPay && <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900">{t("ஆன்லைன் பணம் இன்னும் உறுதியாகவில்லை.")}</p>}
        {!cancelled && (
          <ol className="mt-5 grid grid-cols-5 gap-1 text-center text-[11px] sm:text-xs">
            {STATUS_FLOW.map((s, n) => (
              <li key={s}>
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full font-bold ${n <= idx ? 'bg-maroon text-white' : 'bg-stone-200 text-stone-500'}`}>{n <= idx ? '✓' : n + 1}</div>
                <p className={`mt-1 ${n <= idx ? 'font-semibold text-maroon' : 'text-stone-500'}`}>{t(ORDER_STATUS[s])}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="card mt-4 p-5">
        <h2 className="!text-lg">{t("பொருட்கள்")}</h2>
        <ul className="mt-2 divide-y text-sm">
          {o.items.map((i) => (<li key={i.id} className="flex justify-between gap-2 py-2"><span>{loc(lang, i.name, i.name_en)} <span className="text-stone-500">{t("(அளவு {s}) × {n}", { s: t(i.size), n: i.qty })}</span></span><b>{rupees(i.price * i.qty)}</b></li>))}
        </ul>
        <div className="mt-2 flex justify-between text-sm"><span>{t("டெலிவரி")}</span><span>{o.delivery_fee ? rupees(o.delivery_fee) : t("இலவசம்")}</span></div>
        <div className="mt-1 flex justify-between border-t pt-2 text-lg font-bold text-maroon"><span>{t("மொத்தம்")}</span><span>{rupees(o.total)}</span></div>
        <p className="mt-2 text-sm text-stone-600">{t(PAYMENT_METHOD[o.payment_method])} — {t(PAYMENT_STATUS[o.payment_status])}</p>
      </div>
      <div className="card mt-4 p-5 text-sm"><h2 className="!text-lg">{t("டெலிவரி முகவரி")}</h2><p className="mt-1">{o.name} · {o.phone}</p><p>{o.address}, {o.city} - {o.pincode}</p></div>
      <p className="mt-4 rounded-lg bg-gold-pale p-3 text-xs">{t("பணம் திரும்பத் தரப்படாது; அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும்.")}</p>
    </>
  );
}
