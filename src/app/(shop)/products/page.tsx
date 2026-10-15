import Link from 'next/link';
import type { Metadata } from 'next';
import { categories, filterOptions, listProducts } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = { title: 'அனைத்து உடைகள்' };
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';
const num = (v: string) => (v && /^\d+$/.test(v) ? parseInt(v) : undefined);

export default async function Products({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = {
    q: one(sp.q).slice(0, 80) || undefined,
    category: num(one(sp.category)),
    color: one(sp.color) || undefined,
    fabric: one(sp.fabric) || undefined,
    size: one(sp.size) || undefined,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sort: one(sp.sort),
    page: num(one(sp.page)) || 1,
  };
  const { items, total, pages } = listProducts(f);
  const cats = categories();
  const opt = filterOptions();
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const all: Record<string, string | number | undefined> = { ...f, ...over };
    for (const [k, v] of Object.entries(all)) if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) p.set(k, String(v));
    return '/products?' + p.toString();
  };
  const active = [f.q, f.category, f.color, f.fabric, f.size, f.min, f.max].some((x) => x !== undefined);

  return (
    <div className="container-x py-8">
      <h1 className="text-2xl md:text-3xl font-bold">{f.q ? `"${f.q}" தேடல் முடிவுகள்` : 'அனைத்து உடைகள்'}</h1>
      <p className="mt-1 text-sm text-stone-600">{total} பொருட்கள்</p>

      <details className="card mt-4 p-4 md:open" open={active}>
        <summary className="cursor-pointer font-semibold text-maroon">வடிகட்டிகள் {active && '(செயலில்)'}</summary>
        <form action="/products" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4"><label htmlFor="q">தேடல்</label><input id="q" name="q" defaultValue={f.q} placeholder="பெயர், நிறம், துணி…" /></div>
          <div><label htmlFor="category">வகை</label>
            <select id="category" name="category" defaultValue={f.category ?? ''}><option value="">அனைத்தும்</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label htmlFor="color">நிறம்</label>
            <select id="color" name="color" defaultValue={f.color ?? ''}><option value="">அனைத்தும்</option>{opt.colors.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="fabric">துணி</label>
            <select id="fabric" name="fabric" defaultValue={f.fabric ?? ''}><option value="">அனைத்தும்</option>{opt.fabrics.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="size">அளவு</label>
            <select id="size" name="size" defaultValue={f.size ?? ''}><option value="">அனைத்தும்</option>{opt.sizes.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="min">குறைந்த விலை (₹)</label><input id="min" name="min" type="number" min="0" inputMode="numeric" defaultValue={f.min} /></div>
          <div><label htmlFor="max">அதிக விலை (₹)</label><input id="max" name="max" type="number" min="0" inputMode="numeric" defaultValue={f.max} /></div>
          <div><label htmlFor="sort">வரிசை</label>
            <select id="sort" name="sort" defaultValue={f.sort}><option value="">புதியவை முதலில்</option><option value="price_asc">விலை: குறைவு → அதிகம்</option><option value="price_desc">விலை: அதிகம் → குறைவு</option></select></div>
          <div className="flex items-end gap-2"><button className="btn-primary flex-1">வடிகட்டு</button>{active && <Link href="/products" className="btn-outline">நீக்கு</Link>}</div>
        </form>
      </details>

      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="card mt-6 p-10 text-center text-stone-600">பொருந்தும் உடைகள் எதுவும் இல்லை. வடிகட்டிகளை மாற்றிப் பாருங்கள்.</div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="பக்கங்கள்">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={qs({ page: n })} className={n === f.page ? 'btn-primary !px-4' : 'btn-outline !px-4'}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
