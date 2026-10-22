'use client';
import { useT } from '@/components/LangProvider';
import { useWishlist } from './WishlistProvider';

/** இதய (♡) பொத்தான்: பொருள் அட்டையின் மூலையில் */
export default function WishlistButton({ id, className = '' }: { id: number; className?: string }) {
  const t = useT();
  const { has, toggle, ready } = useWishlist();
  const on = ready && has(id);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      aria-pressed={on}
      aria-label={on ? t('விருப்பப் பட்டியலிலிருந்து நீக்கு') : t('விருப்பப் பட்டியலில் சேர்')}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110 hover:text-maroon ${className}`}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill={on ? '#8a0f5d' : 'none'} stroke={on ? '#8a0f5d' : 'currentColor'} strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.3 5c2 0 3.5 1.1 5.7 3.3C14.2 6.1 15.7 5 17.7 5 21.1 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
