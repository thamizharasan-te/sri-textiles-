'use client';
import Link from 'next/link';
import { useT } from '@/components/LangProvider';
import { useWishlist } from './WishlistProvider';

export default function WishlistLink() {
  const t = useT();
  const { ids, ready } = useWishlist();
  return (
    <Link href="/wishlist" className="relative flex min-h-[44px] min-w-[40px] items-center justify-center rounded-lg px-2 hover:bg-gold-pale" aria-label={ready && ids.length ? t('விருப்பப் பட்டியல், {n} பொருட்கள்', { n: ids.length }) : t('விருப்பப் பட்டியல்')}>
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.3 5c2 0 3.5 1.1 5.7 3.3C14.2 6.1 15.7 5 17.7 5 21.1 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
      </svg>
      {ready && ids.length > 0 && <span className="absolute right-0 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-maroon px-1 text-[10px] font-medium text-white">{ids.length}</span>}
    </Link>
  );
}
