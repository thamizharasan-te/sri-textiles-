'use client';
import Link from 'next/link';
import { useT } from '@/components/LangProvider';
import { imgSrc } from '@/lib/img';
import { rupees } from '@/lib/format';
import WishlistButton from './WishlistButton';

export type TileData = { id: number; name: string; price: number; mrp: number | null; image: string | null; sold: boolean };

/** பொருள் அட்டை: 3:4 படம், இதயம், "விற்றுத் தீர்ந்தது" வட்டம், பெயர், விலை */
export default function ProductTile({ p, priority = false, className = '' }: { p: TileData; priority?: boolean; className?: string }) {
  const t = useT();
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div className={`group relative ${className}`}>
      <Link href={`/products/${p.id}`} className="block" data-tile>
        <div className="relative aspect-[3/4] overflow-hidden bg-gold-pale">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc(p.image, 'm')} alt={p.name} loading={priority ? 'eager' : 'lazy'} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${p.sold ? 'opacity-70' : ''}`} />
          {p.sold && (
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white p-1 text-center text-[10px] font-semibold uppercase leading-tight text-ink shadow">{t('விற்றுத் தீர்ந்தது')}</span>
          )}
          {off > 0 && !p.sold && <span className="absolute left-2 top-2 bg-maroon px-2 py-0.5 text-xs font-medium text-white">{t('{n}% சலுகை', { n: off })}</span>}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-[15px] !font-normal leading-snug text-ink">{p.name}</h3>
        <p className="mt-0.5 text-sm text-stone-700">
          {rupees(p.price)}
          {off > 0 && <span className="ml-2 text-stone-400 line-through">{rupees(p.mrp!)}</span>}
        </p>
      </Link>
      <WishlistButton id={p.id} className="absolute right-2 top-2" />
    </div>
  );
}
