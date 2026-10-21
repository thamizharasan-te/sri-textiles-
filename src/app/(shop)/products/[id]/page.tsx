import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProduct, listProducts, productImages, productSizes } from '@/lib/queries';
import { rupees } from '@/lib/format';
import Gallery from '@/components/Gallery';
import ProductBuy from '@/components/ProductBuy';
import ProductCard from '@/components/ProductCard';
import { getT, getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';

type P = { params: Promise<{ id: string }> };
const pid = (s: string) => (/^\d+$/.test(s) ? parseInt(s) : NaN);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct(pid((await params).id));
  const lang = await getLang();
  return p ? { title: loc(lang, p.name, p.name_en), description: loc(lang, p.description, p.description_en).slice(0, 150) } : {};
}

export default async function ProductPage({ params }: P) {
  const t = await getT();
  const lang = await getLang();
  const id = pid((await params).id);
  const p = Number.isNaN(id) ? undefined : await getProduct(id);
  if (!p || !p.active) notFound();
  const [images, sizes, relatedAll] = await Promise.all([productImages(p.id), productSizes(p.id), p.category_id ? listProducts({ category: p.category_id, limit: 5 }) : Promise.resolve(null)]);
  const related = relatedAll ? relatedAll.items.filter((x) => x.id !== p.id).slice(0, 4) : [];
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div className="container-x py-4 pb-24 md:py-10 md:pb-10">
      <nav className="mb-4 text-sm text-stone-600"><Link href="/products" className="hover:underline">{t("அனைத்து உடைகள்")}</Link>{p.category_name && <> › <Link href={`/products?category=${p.category_id}`} className="hover:underline">{loc(lang, p.category_name, p.category_name_en)}</Link></>}</nav>
      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={images} alt={loc(lang, p.name, p.name_en)} />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{loc(lang, p.name, p.name_en)}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-maroon">{rupees(p.price)}</span>
            {off > 0 && (<><span className="text-stone-400 line-through">{rupees(p.mrp!)}</span><span className="rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-800">{t("{n}% சலுகை", { n: off })}</span></>)}
          </div>
          <p className="text-xs text-stone-500">{t("அனைத்து வரிகளும் உள்ளடக்கியது")}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {p.fabric && <><dt className="text-stone-500">{t("துணி")}</dt><dd className="font-medium">{t(p.fabric)}</dd></>}
            {p.color && <><dt className="text-stone-500">{t("நிறம்")}</dt><dd className="font-medium">{t(p.color)}</dd></>}
            {p.category_name && <><dt className="text-stone-500">{t("வகை")}</dt><dd className="font-medium">{loc(lang, p.category_name, p.category_name_en)}</dd></>}
          </dl>
          <div className="card mt-5 p-4"><ProductBuy product={{ id: p.id, name: p.name, nameEn: p.name_en, price: p.price, image: images[0]?.file ?? null }} sizes={sizes.map((s) => ({ label: s.label, detail: s.detail, stock: s.stock }))} sizeInfo={p.size_info} /></div>
          {p.description && (<div className="mt-6"><h2 className="!text-lg">{t("விளக்கம்")}</h2><p className="mt-1 whitespace-pre-line text-stone-700">{loc(lang, p.description, p.description_en)}</p></div>)}
          <div className="mt-6 rounded-lg border border-gold bg-gold-pale p-4 text-sm">
            <b>{t("மாற்றுக் கொள்கை:")}</b>  {t("பணம் திரும்பத் தரப்படாது. அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும்.")} <Link href="/policy" className="text-maroon underline">{t("மேலும் அறிய")}</Link>
          </div>
        </div>
      </div>
      {related.length > 0 && (<section className="mt-14"><h2 className="sec-title">{t("இவையும் பிடிக்கலாம்")}</h2><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>)}
    </div>
  );
}
