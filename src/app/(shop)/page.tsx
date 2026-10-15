import Link from 'next/link';
import { categories, featuredProducts, newProducts } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import ProductCard from '@/components/ProductCard';

export default async function Home() {
  const [s, cats, featured, fresh] = await Promise.all([getSettings(), categories(), featuredProducts(8), newProducts(8)]);
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-maroon-light text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #e8c766 2px, transparent 3px)', backgroundSize: '40px 40px' }} />
        <div className="container-x relative py-14 md:py-24 text-center">
          <p className="text-gold-light tracking-wide">{s.shop_name}</p>
          <h1 className="mt-3 !text-white text-3xl md:text-5xl font-bold">{s.hero_title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-stone-100">{s.hero_subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="btn-gold">இப்போதே வாங்குங்கள்</Link>
            <Link href="/policy" className="btn border border-white/60 text-white hover:bg-white/10">அளவு & மாற்றுக் கொள்கை</Link>
          </div>
        </div>
        <div className="border-motif" />
      </section>

      {cats.length > 0 && (
        <section className="container-x mt-12">
          <h2 className="sec-title">வகைகள்</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {cats.map((c) => (
              <Link key={c.id} href={`/products?category=${c.id}`} className="card flex min-h-[84px] items-center justify-center p-4 text-center font-semibold text-maroon hover:bg-gold-pale hover:shadow-md">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x mt-14">
          <h2 className="sec-title">சிறப்புப் புடவைகளும் ஆடைகளும்</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <section className="container-x mt-14">
        <h2 className="sec-title">புதிய வரவுகள்</h2>
        {fresh.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{fresh.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        ) : (
          <p className="mt-6 text-center text-stone-500">விரைவில் புதிய உடைகள் வரும்!</p>
        )}
        <div className="mt-8 text-center"><Link href="/products" className="btn-outline">அனைத்தையும் பார்க்க</Link></div>
      </section>

      <section className="container-x mt-14 grid gap-4 md:grid-cols-3">
        {[
          ['🚚', 'உள்ளூர் டெலிவரி', 'உங்கள் ஊருக்குள் வீடு தேடி வரும்'],
          ['💵', 'பொருள் கிடைத்ததும் பணம்', 'COD அல்லது ஆன்லைன் — உங்கள் விருப்பம்'],
          ['🔁', 'அளவு பொருந்தாவிட்டால் மாற்றம்', 'அதே மதிப்புக்கு வேறு உடை'],
        ].map(([i, t, d]) => (
          <div key={t} className="card p-5 text-center"><div className="text-3xl">{i}</div><h3 className="mt-2 !text-lg">{t}</h3><p className="text-sm text-stone-600">{d}</p></div>
        ))}
      </section>
    </>
  );
}
