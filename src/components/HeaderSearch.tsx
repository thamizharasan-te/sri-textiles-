'use client';
import { usePathname } from 'next/navigation';
import { useT } from '@/components/LangProvider';

/** லோகோவுக்குக் கீழ் நடுவில் தேடல் பெட்டி (/search பக்கத்தில் அதற்கென்று தனிப் பெட்டி இருப்பதால் மறைக்கும்) */
export default function HeaderSearch() {
  const t = useT();
  const path = usePathname() || '';
  if (path.startsWith('/search')) return null;
  return (
    <form action="/search" className="container-x pb-2 pt-0.5 md:pb-3">
      <div className="relative mx-auto max-w-xl">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input name="q" placeholder={t("புடவை, குர்தி, சட்டை… தேடுக")} aria-label={t("தேடல்")} className="!rounded-full !pl-10 !py-2.5" />
      </div>
    </form>
  );
}
