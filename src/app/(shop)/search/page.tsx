import Link from 'next/link';
import type { Metadata } from 'next';
import { categories, filterOptions, listProducts } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import FilterPanel, { type FilterValues } from '@/components/FilterPanel';
import { PRICES } from '@/lib/filters';

export const metadata: Metadata = { title: 'தேடு & வடிகட்டு' };
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';
const num = (v: string) => (v && /^\d+$/.test(v) ? parseInt(v) : undefined);

export default async function Search({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const v: FilterValues = {
    q: one(sp.q).trim().slice(0, 80), category: num(one(sp.category)) ? one(sp.category) : '', color: one(sp.color).slice(0, 40), fabric: one(sp.fabric).slice(0, 40),
    size: one(sp.size).slice(0, 30), price: PRICES.some(([k]) => k === one(sp.price)) ? one(sp.price) : '', sort: ['price_asc', 'price_desc'].includes(one(sp.sort)) ? one(sp.sort) : '',
  };
  const [min, max] = v.price ? v.price.split('-').map((x) => (x ? parseInt(x) : undefined)) : [undefined, undefined];
  const page = num(one(sp.page)) || 1;
  const [{ items, total, pages }, cats, opts] = await Promise.all([
    listProducts({ q: v.q || undefined, category: num(v.category), color: v.color || undefined, fabric: v.fabric || undefined, size: v.size || undefined, min, max, sort: v.sort, page }),
    categories(),
    filterOptions(),
  ]);

  const params = (over: Partial<Record<keyof FilterValues | 'page', string>>) => {
    const p = new URLSearchParams();
    for (const [k, val] of Object.entries({ ...v, page: '', ...over })) if (val) p.set(k, val);
    const q = p.toString();
    return '/search' + (q ? '?' + q : '');
  };
  const catName = cats.find((c) => String(c.id) === v.category)?.name;
  const active: [string, string, keyof FilterValues][] = [];
  if (v.q) active.push([`"${v.q}"`, '', 'q']);
  if (catName) active.push([catName, '', 'category']);
  if (v.price) active.push([PRICES.find(([k]) => k === v.price)![1], '', 'price']);
  if (v.size) active.push([`அளவு ${v.size}`, '', 'size']);
  if (v.color) active.push([v.color, '', 'color']);
  if (v.fabric) active.push([v.fabric, '', 'fabric']);

  return (
    <div className="container-x py-5 md:py-8">
      <h1 className="text-xl font-bold md:text-3xl">தேடு & வடிகட்டு</h1>
      <div className="mt-4 md:grid md:grid-cols-[270px_1fr] md:items-start md:gap-8">
        <FilterPanel v={v} opts={{ cats, colors: opts.colors, fabrics: opts.fabrics, sizes: opts.sizes }} activeCount={active.filter((a) => a[2] !== 'q').length} />
        <section aria-live="polite" className="mt-5 md:mt-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-700">{total} பொருட்கள்</p>
            {active.map(([label, , key]) => (
              <Link key={key} href={params({ [key]: '' })} className="inline-flex items-center gap-1 rounded-full bg-gold-pale px-3 py-1.5 text-sm text-maroon-dark" aria-label={`${label} வடிகட்டியை நீக்கு`}>{label} <span aria-hidden>✕</span></Link>
            ))}
            {active.length > 1 && <Link href="/search" className="text-sm text-maroon underline">அனைத்தையும் நீக்கு</Link>}
          </div>
          {items.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="card mt-4 p-8 text-center">
              <p className="text-lg font-semibold">பொருந்தும் உடைகள் இல்லை</p>
              <p className="mt-1 text-sm text-stone-600">வடிகட்டிகளைக் குறைத்துப் பாருங்கள் அல்லது வேறு சொல்லால் தேடுங்கள்.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">{cats.slice(0, 4).map((c) => <Link key={c.id} href={`/search?category=${c.id}`} className="btn-outline !min-h-[40px] text-sm">{c.name}</Link>)}</div>
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="பக்கங்கள்">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <Link key={n} href={params({ page: n === 1 ? '' : String(n) })} className={n === page ? 'btn-primary !px-4' : 'btn-outline !px-4'}>{n}</Link>)}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
