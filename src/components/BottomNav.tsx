'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartProvider';
import { useT } from '@/components/LangProvider';

const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  cart: <><path d="M6 6h15l-2 9H8L6 3H3" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></>,
  track: <><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
};
const ITEMS = [
  { href: '/', label: "முகப்பு", icon: 'home' },
  { href: '/search', label: "தேடு", icon: 'search' },
  { href: '/cart', label: "கூடை", icon: 'cart' },
  { href: '/track', label: "ஆர்டர்", icon: 'track' },
  { href: '/account', label: "கணக்கு", icon: 'user' },
];

/** தொலைபேசியில் கீழ்ப் பட்டி (எல்லாம் கட்டை விரலுக்கு எட்டும்படி) */
export default function BottomNav() {
  const t = useT();
  const path = usePathname() || '/';
  const { count, ready } = useCart();
  const active = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  return (
    <nav aria-label={t("கீழ்ப் பட்டி")} className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={active(i.href) ? 'page' : undefined} className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active(i.href) ? 'text-maroon' : 'text-stone-500'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active(i.href) ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">{ICONS[i.icon]}</svg>
              {t(i.label)}
              {i.icon === 'cart' && ready && count > 0 && <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-maroon px-1 text-[10px] text-white">{count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
