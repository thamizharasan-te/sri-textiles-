import Link from 'next/link';
import { listProducts } from '@/lib/queries';
import { rupees } from '@/lib/format';
import { imgUrl } from '@/lib/images';
import { toggleActive } from '../../actions';

export const metadata = { title: 'பொருட்கள்' };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string }> }) {
  const sp = await searchParams;
  const { items } = listProducts({ onlyActive: false, limit: 500, q: sp.q?.slice(0, 80) });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">பொருட்கள் ({items.length})</h1>
        <Link href="/admin/products/new" className="btn-primary ml-auto">+ புதிய பொருள்</Link>
      </div>
      {sp.saved && <p className="mt-3 rounded-lg bg-green-50 p-3 text-green-800">சேமிக்கப்பட்டது ✓</p>}
      <form className="mt-4"><input name="q" defaultValue={sp.q} placeholder="பெயரால் தேடு…" /></form>
      <div className="mt-4 space-y-2">
        {items.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(p.image, 't')} alt="" className="h-16 w-14 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
              <p className="text-sm text-stone-600">{rupees(p.price)} · {p.category_name || 'வகை இல்லை'} · கையிருப்பு: <b className={p.total_stock <= 0 ? 'text-red-700' : ''}>{p.total_stock}</b></p>
            </div>
            <form action={toggleActive}><input type="hidden" name="id" value={p.id} /><button className={`rounded-full px-3 py-1 text-sm font-semibold ${p.active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>{p.active ? 'விற்பனையில்' : 'மறைக்கப்பட்டது'}</button></form>
            <Link href={`/admin/products/${p.id}`} className="btn-outline !min-h-0 !py-1.5 text-sm">திருத்து</Link>
          </div>
        ))}
        {!items.length && <p className="card p-8 text-center text-stone-500">பொருட்கள் இல்லை. "+ புதிய பொருள்" அழுத்தி சேர்க்கவும்.</p>}
      </div>
    </div>
  );
}
