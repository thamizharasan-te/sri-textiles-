'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLangAction } from '@/app/lang-action';
import { useLang } from './LangProvider';

/** தமிழ் | English மாற்றி */
export default function LangToggle({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (l: 'ta' | 'en') => {
    if (l === lang) return;
    start(async () => {
      await setLangAction(l);
      router.refresh();
    });
  };
  const other = lang === 'ta' ? 'en' : 'ta';
  const btn = (l: 'ta' | 'en', label: string, aria: string) => (
    <button
      type="button"
      lang={l}
      onClick={() => set(l)}
      aria-pressed={lang === l}
      aria-label={aria}
      disabled={pending}
      className={`min-h-[36px] min-w-[44px] px-3 text-sm font-semibold transition ${lang === l ? 'bg-maroon text-white' : onDark ? 'bg-transparent text-white hover:bg-white/10' : 'bg-white text-ink hover:bg-gold-pale'}`}
    >
      {label}
    </button>
  );
  return (
    <>
      {/* தொலைபேசி: ஒரே பொத்தான் (மற்ற மொழிக்கு மாற்றும்) */}
      <button
        type="button"
        lang={other}
        onClick={() => set(other)}
        disabled={pending}
        aria-label={other === 'en' ? 'Switch to English' : 'தமிழுக்கு மாற்று'}
        className={`min-h-[44px] min-w-[48px] rounded-lg border px-2.5 text-sm font-bold sm:hidden ${onDark ? 'border-white/60 text-white hover:bg-white/10' : 'border-maroon text-maroon hover:bg-gold-pale'} ${className}`}
      >
        {other === 'en' ? 'EN' : 'தமிழ்'}
      </button>
      <div role="group" aria-label="Language / மொழி" className={`hidden overflow-hidden rounded-lg border ${onDark ? 'border-white/60' : 'border-maroon'} sm:inline-flex ${className}`}>
        {btn('ta', 'தமிழ்', 'தமிழ்')}
        {btn('en', 'EN', 'English')}
      </div>
    </>
  );
}
