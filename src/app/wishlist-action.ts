'use server';
import { getLang } from '@/lib/i18n-server';
import { loc } from '@/lib/i18n';
import { getProduct } from '@/lib/queries';
import type { TileData } from '@/components/ProductTile';

/** விருப்பப் பட்டியலில் உள்ள பொருட்களின் அட்டைத் தரவு (இப்போதைய விலை/கையிருப்புடன்) */
export async function wishlistProducts(ids: number[]): Promise<TileData[]> {
  const lang = await getLang();
  const list = ids.filter((x) => Number.isInteger(x)).slice(0, 60);
  const rows = await Promise.all(list.map((id) => getProduct(id)));
  return rows
    .filter((p): p is NonNullable<typeof p> => !!p && !!p.active)
    .map((p) => ({ id: p.id, name: loc(lang, p.name, p.name_en), price: p.price, mrp: p.mrp, image: p.image, sold: p.total_stock <= 0 }));
}
