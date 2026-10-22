'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { wishlistProducts } from '@/app/wishlist-action';
import { useT } from '@/components/LangProvider';
import ProductTile, { type TileData } from './ProductTile';
import { useWishlist } from './WishlistProvider';

export default function WishlistView() {
  const t = useT();
  const { ids, ready } = useWishlist();
  const [items, setItems] = useState<TileData[] | null>(null);
  const key = ids.join(',');
  useEffect(() => {
    if (!ready) return;
    let live = true;
    if (!ids.length) { setItems([]); return; }
    wishlistProducts(ids).then((r) => live && setItems(r)).catch(() => live && setItems([]));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  if (!ready || items === null) return <p className="py-16 text-center text-stone-500">{t('ஏற்றுகிறது…')}</p>;
  if (!items.length)
    return (
      <div className="py-16 text-center">
        <p className="text-lg">{t('உங்கள் விருப்பப் பட்டியல் காலியாக உள்ளது')}</p>
        <p className="mt-1 text-sm text-stone-600">{t('பிடித்த உடையின் மேல் உள்ள ♡ ஐ அழுத்துங்கள்.')}</p>
        <Link href="/products" className="btn-primary mt-6">{t('உடைகளைப் பார்க்க')}</Link>
      </div>
    );
  return <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{items.map((p) => <ProductTile key={p.id} p={p} />)}</div>;
}
