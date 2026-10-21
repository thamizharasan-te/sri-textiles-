import Link from 'next/link';
import CartLink from './CartLink';
import HeaderSearch from './HeaderSearch';
import LangToggle from './LangToggle';
import { isDemo } from '@/lib/env';
import { currentCustomer } from '@/lib/customer';
import { getT, getLocalizedSettings } from '@/lib/i18n-server';

const NAV = [
  { href: '/products', label: "அனைத்து உடைகள்" },
  { href: '/search', label: "தேடு & வடிகட்டு" },
  { href: '/track', label: "ஆர்டர் நிலை" },
];

export default async function Header() {
  const t = await getT();
  const [s, me] = await Promise.all([getLocalizedSettings(), currentCustomer()]);
  return (
    <>
    {isDemo() && <div className="bg-yellow-100 px-3 py-1 text-center text-[11px] leading-snug text-yellow-900 sm:text-xs"><b>{t("டெமோ")}</b>  {t("கடை — மாதிரிப் பொருட்கள்; சோதனை ஆர்டர் செய்து பார்க்கலாம்")}</div>}
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-cream/95 backdrop-blur">
      <div className="border-motif" />
      <div className="container-x flex items-center gap-2 pt-2">
        <Link href="/" className="whitespace-nowrap font-serif text-xl font-bold leading-tight text-maroon md:text-2xl">{s.shop_name}</Link>
        <nav className="ml-2 hidden lg:flex xl:ml-4" aria-label={t("முதன்மை")}>
          {NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-gold-pale">{t(n.label)}</Link>)}
        </nav>
        <div className="ml-auto flex items-center">
          <Link href="/search" className="hidden min-h-[44px] items-center gap-1 rounded-lg px-3 font-medium hover:bg-gold-pale md:flex lg:hidden" aria-label={t("தேடு & வடிகட்டு")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span className="lg:hidden">{t("தேடு")}</span>
          </Link>
          <LangToggle className="mr-1" />
          <Link href={me ? '/account' : '/account/login'} className="flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 font-medium hover:bg-gold-pale md:px-3" aria-label={me ? t('என் கணக்கு') : t('உள்நுழை')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
            <span className="hidden max-w-[7rem] truncate sm:inline">{me ? me.name.split(' ')[0] : t("உள்நுழை")}</span>
          </Link>
          <CartLink />
        </div>
      </div>
      <div className="h-2" />
    </header>
      <HeaderSearch />
    </>
  );
}
