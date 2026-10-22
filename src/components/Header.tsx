import Link from 'next/link';
import CartLink from './CartLink';
import HeaderSearch from './HeaderSearch';
import LangToggle from './LangToggle';
import Logo from './Logo';
import WishlistLink from './WishlistLink';
import Announcement from './Announcement';
import { getT, getLocalizedSettings } from '@/lib/i18n-server';
import { isDemo } from '@/lib/env';
import { currentCustomer } from '@/lib/customer';

const NAV = [
  { href: '/', label: 'முகப்பு' },
  { href: '/products', label: 'அனைத்து உடைகள்' },
  { href: '/track', label: 'ஆர்டர் நிலை' },
  { href: '/contact', label: 'தொடர்புக்கு' },
];

export default async function Header() {
  const t = await getT();
  const [s, me] = await Promise.all([getLocalizedSettings(), currentCustomer()]);
  return (
    <>
      {isDemo() && <div className="bg-stone-900 px-3 py-1 text-center text-[11px] leading-snug text-stone-200 sm:text-xs"><b>{t("டெமோ")}</b>  {t("கடை — மாதிரிப் பொருட்கள்; சோதனை ஆர்டர் செய்து பார்க்கலாம்")}</div>}
      <Announcement />
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-cream/95 backdrop-blur">
        <div className="container-x relative flex h-[64px] items-center md:h-[84px]">
          {/* இடம்: கணினியில் மெனு; தொலைபேசியில் மொழி */}
          <nav className="hidden items-center gap-1 md:flex" aria-label={t('முதன்மை')}>
            {NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-2 text-[15px] hover:text-maroon">{t(n.label)}</Link>)}
          </nav>
          <div className="md:hidden"><LangToggle /></div>
          {/* நடு: சின்னம் */}
          <Link href="/" className="absolute left-1/2 flex max-w-[44vw] -translate-x-1/2 md:max-w-[30vw]" aria-label={s.shop_name}><Logo name={s.shop_name} logo={s.logo} slogan={s.tagline} /></Link>
          {/* வலம்: ஐகான்கள் */}
          <div className="ml-auto flex shrink-0 items-center">
            <div className="hidden md:block"><LangToggle className="mr-2" /></div>
            <Link href="/search" className="hidden min-h-[44px] min-w-[40px] items-center justify-center rounded-lg px-2 hover:bg-gold-pale md:flex" aria-label={t('தேடு & வடிகட்டு')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </Link>
            <Link href={me ? '/account' : '/account/login'} className="hidden min-h-[44px] min-w-[40px] items-center justify-center rounded-lg px-2 hover:bg-gold-pale md:flex" aria-label={me ? t('என் கணக்கு') : t('உள்நுழை')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
            </Link>
            <WishlistLink />
            <CartLink />
          </div>
        </div>
      </header>
      <HeaderSearch />
    </>
  );
}
