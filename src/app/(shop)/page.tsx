import Link from 'next/link';
import { featuredProducts, newProducts, shelves, type Product } from '@/lib/queries';
import { getLang, getLocalizedSettings, getT } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';
import { imgSrc } from '@/lib/img';
import { rupees } from '@/lib/format';
import ProductTile, { type TileData } from '@/components/ProductTile';
import TabbedCollections, { type Tab } from '@/components/TabbedCollections';

const SCROLL_NONE = { scrollbarWidth: 'none' } as const;

export default async function Home() {
  const t = await getT();
  const lang = await getLang();
  const [s, shelf, featured, fresh] = await Promise.all([getLocalizedSettings(), shelves(10), featuredProducts(10), newProducts(10)]);
  const tile = (p: Product): TileData => ({ id: p.id, name: loc(lang, p.name, p.name_en), price: p.price, mrp: p.mrp, image: p.image, sold: p.total_stock <= 0 });

  // பதாகை: கடைக்காரர் ஏற்றிய படங்கள்; இல்லையெனில் சிறப்புப் பொருட்களின் படங்கள்
  const heroSrc = [s.hero_img1, s.hero_img2].filter(Boolean).map((f) => ({ src: imgSrc(f, 'l'), alt: s.shop_name, href: '/products', caption: s.tagline }));
  const heroFallback = (featured.length ? featured : fresh).slice(0, 2).map((p) => ({ src: imgSrc(p.image, 'l'), alt: loc(lang, p.name, p.name_en), href: `/products/${p.id}`, caption: loc(lang, p.name, p.name_en) }));
  const hero = heroSrc.length ? heroSrc : heroFallback;

  const tabs: Tab[] = [
    { key: 'new', label: t('புதிய வரவுகள்'), href: '/products', items: fresh.map(tile) },
    { key: 'best', label: t('அதிகம் விற்பவை'), href: '/products', items: (featured.length ? featured : fresh).map(tile) },
    ...shelf.map(({ cat, items }) => ({ key: `c${cat.id}`, label: loc(lang, cat.name, cat.name_en), href: `/products?category=${cat.id}`, items: items.map(tile) })),
  ].filter((x) => x.items.length > 0);

  const looks = [...featured, ...fresh].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(2, 6);
  const ig = s.instagram.replace(/^@/, '');

  return (
    <>
      <h1 className="sr-only">{s.shop_name} — {s.tagline}</h1>
      {/* வட்ட வகைப் படங்கள் (story வரிசை) */}
      {shelf.length > 0 && (
        <section aria-label={t('வகைகள் வாரியாக வாங்குக')} className="border-b border-stone-100 bg-white">
          <ul className="container-x flex snap-x gap-4 overflow-x-auto py-4 md:justify-center md:gap-6 md:py-5" style={SCROLL_NONE}>
            {shelf.map(({ cat, items }) => (
              <li key={cat.id} className="w-[76px] shrink-0 snap-start md:w-[104px]">
                <Link href={`/products?category=${cat.id}`} className="group block text-center">
                  <span className="mx-auto block rounded-full bg-gradient-to-tr from-maroon via-[#c2185b] to-gold p-[3px]">
                    <span className="block rounded-full bg-white p-[3px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgSrc(items[0]?.image, 't')} alt="" loading="lazy" className="aspect-square w-full rounded-full object-cover object-top transition duration-500 group-hover:scale-105" />
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 block text-[12px] font-medium leading-tight text-ink md:text-[13px]">{loc(lang, cat.name, cat.name_en)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* பெரிய பதாகைப் படங்கள் */}
      {hero.length > 0 && (
        <section aria-label={t('சிறப்புப் பதாகை')}>
          <div className="flex snap-x overflow-x-auto md:grid md:grid-cols-2" style={SCROLL_NONE}>
            {hero.map((h, i) => (
              <Link key={i} href={h.href} className="group relative block min-w-full snap-start overflow-hidden bg-gold-pale md:min-w-0">
                <div className="aspect-[4/5] md:aspect-auto md:h-[min(78vh,760px)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.src} alt={h.alt} loading={i === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]" />
                </div>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 pt-16 text-white">
                  <span className="block text-lg font-medium leading-snug md:text-xl">{h.caption}</span>
                  <span className="mt-1 inline-block border-b border-white/70 text-sm">{t('இப்போதே வாங்குங்கள்')} →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* வகைகள் வாரியாக வாங்குக */}
      {shelf.length > 0 && (
        <section className="container-x mt-12 md:mt-20">
          <h2 className="text-2xl font-medium md:text-4xl">{t('வகைகள் வாரியாக வாங்குக')}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {shelf.map(({ cat, items, total }) => (
              <Link key={cat.id} href={`/products?category=${cat.id}`} className="group relative block aspect-[3/4] overflow-hidden bg-gold-pale">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc(items[0]?.image, 'm')} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white md:p-4">
                  <span className="min-w-0">
                    <span className="block text-base font-medium leading-tight md:text-xl">{loc(lang, cat.name, cat.name_en)}</span>
                    <span className="mt-0.5 block text-xs text-white/80 md:text-sm">{t('{n} பொருட்கள்', { n: total })}</span>
                  </span>
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink transition group-hover:bg-maroon group-hover:text-white md:h-11 md:w-11">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* tabs + நகரும் வரிசை */}
      {tabs.length > 0 && (
        <section className="container-x mt-14 md:mt-24" aria-label={t('தொகுப்புகள்')}>
          <TabbedCollections tabs={tabs} />
        </section>
      )}

      {/* எங்கள் தோற்றங்கள் */}
      {looks.length > 0 && (
        <section className="container-x mt-14 text-center md:mt-24">
          <h2 className="text-2xl font-medium md:text-4xl">{t('எங்கள் தோற்றங்கள்')}</h2>
          <p className="mt-2 text-stone-600">{t('ஒரு தோற்றத்தைத் தொட்டு வாங்குங்கள்')}</p>
          {ig && (
            <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-maroon px-5 py-2 text-maroon hover:bg-maroon hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              @{ig}
            </a>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left md:grid-cols-4 md:gap-5">
            {looks.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group relative block aspect-[9/14] overflow-hidden bg-gold-pale">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc(p.image, 'm')} alt={loc(lang, p.name, p.name_en)} loading="lazy" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-12 text-white">
                  <span className="block line-clamp-1 text-sm font-medium">{loc(lang, p.name, p.name_en)}</span>
                  <span className="text-xs text-white/85">{rupees(p.price)} · {t('இப்போதே வாங்கு')}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-x mt-14 grid gap-3 md:mt-20 md:grid-cols-3">
        {[
          ['🚚', 'உள்ளூர் டெலிவரி', 'உங்கள் ஊருக்குள் வீடு தேடி வரும்'],
          ['💵', 'பொருள் கிடைத்ததும் பணம்', 'COD — பொருளைப் பார்த்த பின் பணம்'],
          ['🔁', 'அளவு பொருந்தாவிட்டால் மாற்றம்', 'அதே மதிப்புக்கு வேறு உடை'],
        ].map(([i, a, b]) => (
          <div key={a} className="flex items-center gap-4 border border-stone-200 p-4 md:block md:p-6 md:text-center">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-pale text-2xl md:mx-auto">{i}</div>
            <div><h3 className="md:mt-3 !text-base !font-medium md:!text-lg">{t(a)}</h3><p className="text-sm text-stone-600">{t(b)}</p></div>
          </div>
        ))}
      </section>
    </>
  );
}
