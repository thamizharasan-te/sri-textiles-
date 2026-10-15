import Link from 'next/link';
import CartLink from './CartLink';
import { getSettings } from '@/lib/settings';

const NAV = [
  { href: '/products', label: 'அனைத்தும்' },
  { href: '/track', label: 'ஆர்டர் நிலை' },
  { href: '/about', label: 'எங்களைப் பற்றி' },
  { href: '/contact', label: 'தொடர்புக்கு' },
];

export default function Header() {
  const s = getSettings();
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-stone-200">
      <div className="border-motif" />
      <div className="container-x flex items-center gap-2 py-2">
        <Link href="/" className="font-serif text-xl md:text-2xl font-bold text-maroon leading-tight">
          {s.shop_name}
        </Link>
        <nav className="ml-6 hidden md:flex gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 hover:bg-gold-pale">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <form action="/products" className="hidden sm:block">
            <input name="q" placeholder="தேடுக…" aria-label="தேடல்" className="!w-44 lg:!w-60 !py-2" />
          </form>
          <CartLink />
          <details className="relative md:hidden">
            <summary className="list-none cursor-pointer rounded-lg px-3 py-2 hover:bg-gold-pale" aria-label="பட்டியல்">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </summary>
            <div className="absolute right-0 mt-2 w-56 card p-2">
              <form action="/products" className="p-2"><input name="q" placeholder="தேடுக…" aria-label="தேடல்" /></form>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 hover:bg-gold-pale">{n.label}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
