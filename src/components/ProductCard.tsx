import Link from 'next/link';
import { imgSrc } from '@/lib/img';
import { rupees } from '@/lib/format';
import type { Product } from '@/lib/queries';
import { getT } from '@/lib/i18n-server';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';

export default async function ProductCard({ p }: { p: Product }) {
  const t = await getT();
  const lang = await getLang();
  const sold = p.total_stock <= 0;
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <Link href={`/products/${p.id}`} className="card group overflow-hidden block hover:shadow-md transition">
      <div className="relative aspect-[4/5] bg-gold-pale overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc(p.image, 't')} alt={loc(lang, p.name, p.name_en)} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
        {sold && <span className="absolute inset-0 grid place-items-center bg-black/50 font-bold text-white">{t("விற்றுத் தீர்ந்தது")}</span>}
        {off > 0 && !sold && <span className="absolute left-2 top-2 rounded bg-maroon px-2 py-0.5 text-xs text-white">{t("{n}% சலுகை", { n: off })}</span>}
      </div>
      <div className="p-3">
        <h3 className="!text-base !font-semibold !text-ink line-clamp-2 min-h-[2.7em]">{loc(lang, p.name, p.name_en)}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-maroon">{rupees(p.price)}</span>
          {p.mrp && p.mrp > p.price && <span className="text-sm text-stone-400 line-through">{rupees(p.mrp)}</span>}
        </div>
      </div>
    </Link>
  );
}
