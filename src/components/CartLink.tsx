'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 font-medium hover:bg-gold-pale md:px-3" aria-label={`கூடை${ready && count ? `, ${count} பொருட்கள்` : ''}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6h15l-2 9H8L6 3H3" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
      <span className="hidden sm:inline">கூடை</span>
      {ready && count > 0 && <span className="absolute right-0 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-maroon px-1 text-xs text-white">{count}</span>}
    </Link>
  );
}
