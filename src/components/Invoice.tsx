import { gstBreakup, type OrderFull } from '@/lib/orders';
import { formatDate, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/format';
import PrintButton from './PrintButton';
import { getT } from '@/lib/i18n-server';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';
import { getLocalizedSettings } from '@/lib/i18n-server';

const money = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Invoice({ o }: { o: OrderFull }) {
  const t = await getT();
  const s = await getLocalizedSettings();
  const lang = await getLang();
  const { byRate } = gstBreakup(o.items);
  const hasGst = !!s.gstin;
  const rates = [...byRate.entries()].sort((a, b) => a[0] - b[0]);
  const totalTax = rates.reduce((a, [, g]) => a + g.tax, 0);
  return (
    <div className="container-x max-w-3xl py-6">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <div className="card bg-white p-6 text-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="!text-2xl">{s.shop_name}</h1>
            {s.address && <p>{s.address}{s.city ? ', ' + s.city : ''}</p>}
            {s.phone && <p>{t("கைபேசி:")} {s.phone}</p>}
            {hasGst && <p><b>GSTIN:</b> {s.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-maroon">{hasGst ? t("TAX INVOICE / வரி ரசீது") : t("விற்பனை ரசீது")}</p>
            <p>{t("ரசீது எண்:")} <b>{o.order_no}</b></p>
            <p>{t("தேதி:")} {formatDate(o.created_at, lang)}</p>
          </div>
        </div>
        <div className="grid gap-4 border-b py-4 sm:grid-cols-2">
          <div><p className="font-semibold">{t("வாங்குபவர் / Bill To")}</p><p>{o.name}</p><p className="whitespace-pre-line">{o.address}, {o.city} - {o.pincode}</p><p>{t("கைபேசி:")} {o.phone}</p></div>
          <div><p className="font-semibold">{t("பணம்")}</p><p>{t(PAYMENT_METHOD[o.payment_method])}</p><p>{t("நிலை:")} {t(PAYMENT_STATUS[o.payment_status])}</p></div>
        </div>
        <table className="mt-4 w-full">
          <thead><tr className="border-b text-left"><th className="py-2">#</th><th>{t("விவரம்")}</th><th>{t("அளவு")}</th><th className="text-right">{t("எண்.")}</th><th className="text-right">{t("விலை")}</th><th className="text-right">{t("தொகை")}</th></tr></thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={i.id} className="border-b"><td className="py-2">{n + 1}</td><td>{loc(lang, i.name, i.name_en)}</td><td>{t(i.size)}</td><td className="text-right">{i.qty}</td><td className="text-right">{money(i.price)}</td><td className="text-right">{money(i.price * i.qty)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1">
          <div className="flex justify-between"><span>{t("பொருட்கள் (வரி உட்பட)")}</span><span>{money(o.subtotal)}</span></div>
          <div className="flex justify-between"><span>{t("டெலிவரி")}</span><span>{o.delivery_fee ? money(o.delivery_fee) : t("இலவசம்")}</span></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><span>{t("மொத்தம்")}</span><span>{money(o.total)}</span></div>
        </div>
        {hasGst && (
          <div className="mt-6">
            <p className="font-semibold">{t("GST விவரம் (விலையில் உள்ளடக்கியது)")}</p>
            <table className="mt-1 w-full text-xs">
              <thead><tr className="border-b text-left"><th className="py-1">{t("விகிதம்")}</th><th className="text-right">{t("வரிக்குட்பட்ட மதிப்பு")}</th><th className="text-right">CGST</th><th className="text-right">SGST</th><th className="text-right">{t("மொத்த வரி")}</th></tr></thead>
              <tbody>
                {rates.map(([r, g]) => (
                  <tr key={r} className="border-b"><td className="py-1">{r}%</td><td className="text-right">{money(g.taxable)}</td><td className="text-right">{money(g.tax / 2)}</td><td className="text-right">{money(g.tax / 2)}</td><td className="text-right">{money(g.tax)}</td></tr>
                ))}
                <tr className="font-semibold"><td className="py-1">{t("மொத்தம்")}</td><td className="text-right">{money(rates.reduce((a, [, g]) => a + g.taxable, 0))}</td><td className="text-right">{money(totalTax / 2)}</td><td className="text-right">{money(totalTax / 2)}</td><td className="text-right">{money(totalTax)}</td></tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-6 border-t pt-3 text-xs text-stone-600">{t("பணம் திரும்பத் தரப்படாது; அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும். இது கணினி மூலம் உருவாக்கப்பட்ட ரசீது.")}</p>
      </div>
    </div>
  );
}
