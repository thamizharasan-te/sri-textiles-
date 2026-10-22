'use client';
import Link from 'next/link';
import { useT } from '@/components/LangProvider';
import { useCart } from './CartProvider';

export default function CartLink() {
  const t = useT();
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative flex min-h-[44px] min-w-[40px] items-center justify-center rounded-lg px-2 hover:bg-gold-pale" aria-label={ready && count ? t('கூடை, {n} பொருட்கள்', { n: count }) : t('கூடை')}>
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
      {ready && count > 0 && <span className="absolute right-0 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-maroon px-1 text-[10px] font-medium text-white">{count}</span>}
    </Link>
  );
}
