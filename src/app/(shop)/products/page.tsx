import Link from 'next/link';
import type { Metadata } from 'next';
import { categories, listProducts } from '@/lib/queries';
import ProductCard from '@/components/ProductCard';
import { getT } from '@/lib/i18n-server';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("அனைத்து உடைகள்") };
}
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';
const num = (v: string) => (v && /^\d+$/.test(v) ? parseInt(v) : undefined);

export default async function Products({ searchParams }: { searchParams: Promise<SP> }) {
  const t = await getT();
  const sp = await searchParams;
  const category = num(one(sp.category));
  const sort = ['price_asc', 'price_desc'].includes(one(sp.sort)) ? one(sp.sort) : '';
  const page = num(one(sp.page)) || 1;
  const [{ items, total, pages }, cats] = await Promise.all([listProducts({ category, sort, page }), categories()]);
  const cur = cats.find((c) => c.id === category);
  const lang = await getLang();
  const href = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ category, sort, page: 1, ...over })) if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) p.set(k, String(v));
    const q = p.toString();
    return '/products' + (q ? '?' + q : '');
  };
  const chip = (on: boolean) => `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${on ? 'border-maroon bg-maroon text-white' : 'border-stone-300 bg-white text-ink hover:border-maroon'}`;

  return (
    <div className="container-x py-5 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-3xl">{cur ? loc(lang, cur.name, cur.name_en) : t("அனைத்து உடைகள்")}</h1>
          <p className="text-sm text-stone-600">{t("{n} பொருட்கள்", { n: total })}</p>
        </div>
        <Link href="/search" className="btn-outline !min-h-[44px] !px-4 text-sm">{t("🔍 தேடு & வடிகட்டு")}</Link>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0" style={{ scrollbarWidth: 'none' }}>
        <Link href={href({ category: undefined })} className={chip(!category)}>{t("அனைத்தும்")}</Link>
        {[...cats].sort((a, b) => Number(b.id === category) - Number(a.id === category)).map((c) => <Link key={c.id} href={href({ category: c.id })} className={chip(category === c.id)}>{loc(lang, c.name, c.name_en)}</Link>)}
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-stone-600">{t("வரிசை:")}</span>
        {[['', t("புதியவை")], ['price_asc', t("விலை ↑")], ['price_desc', t("விலை ↓")]].map(([v, l]) => (
          <Link key={v} href={href({ sort: v })} className={`rounded-lg px-3 py-2 ${sort === v ? 'bg-gold-pale font-semibold text-maroon' : 'text-stone-700 hover:bg-gold-pale'}`}>{l}</Link>
        ))}
      </div>

      {items.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="card mt-6 p-10 text-center text-stone-600">{t("இந்த வகையில் உடைகள் இல்லை.")}</div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label={t("பக்கங்கள்")}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={href({ page: n })} className={n === page ? 'btn-primary !px-4' : 'btn-outline !px-4'}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
