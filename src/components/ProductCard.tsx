import ProductTile from './ProductTile';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';
import type { Product } from '@/lib/queries';

export default async function ProductCard({ p, priority }: { p: Product; priority?: boolean }) {
  const lang = await getLang();
  return <ProductTile p={{ id: p.id, name: loc(lang, p.name, p.name_en), price: p.price, mrp: p.mrp, image: p.image, sold: p.total_stock <= 0 }} priority={priority} />;
}
