import Link from 'next/link';
import { featuredProducts, newProducts, shelves } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { imgSrc } from '@/lib/img';
import ProductCard from '@/components/ProductCard';

export default async function Home() {
  const [s, shelf, featured, fresh] = await Promise.all([getSettings(), shelves(4), featuredProducts(8), newProducts(8)]);
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-maroon-light text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #e8c766 2px, transparent 3px)', backgroundSize: '40px 40px' }} />
        <div className="container-x relative py-9 text-center md:py-20">
          <p className="text-sm tracking-wide text-gold-light md:text-base">{s.shop_name}</p>
          <h1 className="mx-auto mt-2 max-w-3xl !text-white text-[1.65rem] font-bold leading-snug md:mt-3 md:text-5xl">{s.hero_title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-100 md:mt-4 md:text-base">{s.hero_subtitle}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:mt-8">
            <Link href="/products" className="btn-gold">இப்போதே வாங்குங்கள்</Link>
            <Link href="/search" className="btn border border-white/60 text-white hover:bg-white/10">தேடு & வடிகட்டு</Link>
          </div>
        </div>
        <div className="border-motif" />
      </section>

      {shelf.length > 0 && (
        <section className="container-x mt-8 md:mt-12">
          <h2 className="sec-title">எங்கள் அனைத்து ஆடைகளும்</h2>
          <p className="mt-3 text-center text-sm text-stone-600">புடவை முதல் குழந்தைகள் உடை, ஆண்கள் உடை வரை — ஒரே இடத்தில்</p>
          <ul className="-mx-4 mt-5 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-8" style={{ scrollbarWidth: 'none' }}>
            {shelf.map(({ cat, items }) => (
              <li key={cat.id} className="w-[28vw] min-w-[104px] max-w-[150px] shrink-0 snap-start md:w-auto md:max-w-none">
                <Link href={`/products?category=${cat.id}`} className="group block text-center">
                  <span className="mx-auto block aspect-square w-full overflow-hidden rounded-full border-2 border-gold bg-gold-pale">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgSrc(items[0]?.image, 't')} alt="" loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-110" />
                  </span>
                  <span className="mt-2 block text-[13px] font-semibold leading-snug text-maroon-dark md:text-sm">{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x mt-10 md:mt-14">
          <h2 className="sec-title">சிறப்புத் தேர்வுகள்</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-5">{featured.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}

      {shelf.map(({ cat, items, total }) => (
        <section key={cat.id} className="container-x mt-10 md:mt-14" aria-labelledby={`cat-${cat.id}`}>
          <div className="flex items-end justify-between gap-3 border-b border-gold/40 pb-2">
            <h2 id={`cat-${cat.id}`} className="!text-xl md:!text-2xl">{cat.name}</h2>
            <Link href={`/products?category=${cat.id}`} className="shrink-0 py-2 text-sm font-semibold text-maroon underline">அனைத்தும் ({total}) ›</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      ))}

      {fresh.length > 0 && (
        <section className="container-x mt-10 md:mt-14">
          <h2 className="sec-title">புதிய வரவுகள்</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4 md:gap-5">{fresh.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <div className="mt-8 text-center"><Link href="/products" className="btn-outline">அனைத்தையும் பார்க்க</Link></div>
        </section>
      )}

      <section className="container-x mt-12 grid gap-3 md:grid-cols-3">
        {[
          ['🚚', 'உள்ளூர் டெலிவரி', 'உங்கள் ஊருக்குள் வீடு தேடி வரும்'],
          ['💵', 'பொருள் கிடைத்ததும் பணம்', 'COD — பொருளைப் பார்த்த பின் பணம்'],
          ['🔁', 'அளவு பொருந்தாவிட்டால் மாற்றம்', 'அதே மதிப்புக்கு வேறு உடை'],
        ].map(([i, t, d]) => (
          <div key={t} className="card flex items-center gap-4 p-4 text-left md:block md:p-5 md:text-center"><div className="text-3xl">{i}</div><div><h3 className="md:mt-2 !text-base md:!text-lg">{t}</h3><p className="text-sm text-stone-600">{d}</p></div></div>
        ))}
      </section>
    </>
  );
}
