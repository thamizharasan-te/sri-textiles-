'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useT } from '@/components/LangProvider';
import ProductTile, { type TileData } from './ProductTile';

export type Tab = { key: string; label: string; href: string; items: TileData[] };

/** "Kurties | best sellers | new arrivals" போல் tabs + நகரும் வரிசை (carousel) */
export default function TabbedCollections({ tabs }: { tabs: Tab[] }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const cur = tabs[active] ?? tabs[0];
  if (!cur) return null;
  const scrollBy = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * (track.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <div>
      <div role="tablist" aria-label={t('தொகுப்புகள்')} className="-mx-4 flex gap-6 overflow-x-auto px-4 md:justify-center" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((x, i) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={i === active}
            onClick={() => { setActive(i); track.current?.scrollTo({ left: 0 }); }}
            className={`shrink-0 whitespace-nowrap border-b-2 py-2 text-base transition ${i === active ? 'border-ink text-ink' : 'border-transparent text-stone-400 hover:text-ink'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="relative mt-6">
        <div ref={track} role="tabpanel" className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:mx-0 md:gap-5 md:px-0" style={{ scrollbarWidth: 'none' }}>
          {cur.items.map((p, i) => <ProductTile key={`${cur.key}-${p.id}`} p={p} priority={i < 2} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[19%]" />)}
        </div>
        {cur.items.length > 2 && (
          <>
            <button onClick={() => scrollBy(-1)} aria-label={t('முந்தையது')} className="absolute left-2 top-[34%] hidden h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-md hover:text-maroon md:grid">‹</button>
            <button onClick={() => scrollBy(1)} aria-label={t('அடுத்தது')} className="absolute right-2 top-[34%] hidden h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-md hover:text-maroon md:grid">›</button>
          </>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link href={cur.href} className="btn-outline !rounded-sm !px-10">{t('அனைத்துப் பொருட்களையும் பார்க்க')}</Link>
      </div>
    </div>
  );
}
