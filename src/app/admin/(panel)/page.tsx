import Link from 'next/link';
import { salesSummary } from '@/lib/orders';
import { ORDER_STATUS, rupees } from '@/lib/format';

export const metadata = { title: 'நிர்வாகம் — சுருக்கம்' };

export default function Dashboard() {
  const s = salesSummary();
  const newCount = s.byStatus.find((x) => x.status === 'new')?.n ?? 0;
  const tiles = [
    ['இன்று', s.today], ['கடந்த 7 நாட்கள்', s.week], ['கடந்த 30 நாட்கள்', s.month],
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">விற்பனைச் சுருக்கம்</h1>
      {newCount > 0 && <Link href="/admin/orders?status=new" className="block rounded-xl bg-yellow-100 p-4 font-semibold text-yellow-900">🔔 {newCount} புதிய ஆர்டர்கள் காத்திருக்கின்றன — பார்க்க</Link>}
      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map(([l, v]) => (
          <div key={l} className="card p-5"><p className="text-sm text-stone-500">{l}</p><p className="mt-1 text-3xl font-bold text-maroon">{rupees(v.amt)}</p><p className="text-sm text-stone-600">{v.n} ஆர்டர்கள்</p></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="!text-lg">ஆர்டர் நிலைகள்</h2>
          <ul className="mt-2 space-y-1 text-sm">{Object.keys(ORDER_STATUS).map((k) => (<li key={k} className="flex justify-between"><Link className="hover:underline" href={`/admin/orders?status=${k}`}>{ORDER_STATUS[k]}</Link><b>{s.byStatus.find((x) => x.status === k)?.n ?? 0}</b></li>))}</ul>
        </div>
        <div className="card p-5">
          <h2 className="!text-lg">அதிகம் விற்றவை (30 நாள்)</h2>
          {s.top.length ? <ul className="mt-2 space-y-1 text-sm">{s.top.map((t) => (<li key={t.name} className="flex justify-between gap-2"><span>{t.name}</span><b>{t.qty} × </b></li>))}</ul> : <p className="mt-2 text-sm text-stone-500">இன்னும் விற்பனை இல்லை</p>}
        </div>
        <div className="card p-5">
          <h2 className="!text-lg">கையிருப்பு குறைவு (≤ 2)</h2>
          {s.lowStock.length ? <ul className="mt-2 space-y-1 text-sm">{s.lowStock.map((l, i) => (<li key={i} className="flex justify-between gap-2"><Link className="hover:underline" href={`/admin/products/${l.id}`}>{l.name} ({l.label})</Link><b className={l.stock === 0 ? 'text-red-700' : ''}>{l.stock}</b></li>))}</ul> : <p className="mt-2 text-sm text-stone-500">எல்லாம் போதுமான அளவு உள்ளது</p>}
        </div>
      </div>
    </div>
  );
}
