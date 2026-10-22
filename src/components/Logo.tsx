import { imgSrc } from '@/lib/img';

/** முதலெழுத்துக்கள்: "TR Cloth Store" → TR; "Sri Textiles" → ST */
export const monogram = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'S';
  const first = Array.from(w[0]);
  return (first.length <= 3 && w.length > 1 ? w[0] : first[0] + (Array.from(w[1] ?? '')[0] ?? '')).toUpperCase();
};

/** வரையப்பட்ட சின்னம் (தங்கத் தொங்கி + எழுத்துக்கள் + புடவை முந்தானை). கடைக்காரர் உண்மை லோகோவை ஏற்றினால் அது காட்டப்படும். */
export function Emblem({ letters, className = '' }: { letters: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 104" className={className} aria-hidden="true" role="img">
      <path d="M60 22v-7a6 6 0 1 1 6 6" fill="none" stroke="#c9962b" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 22L10 42q-3 1.5 1 2h98q4-.5 1-2z" fill="none" stroke="#c9962b" strokeWidth="3" strokeLinejoin="round" />
      <text x="58" y="92" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" fontSize={letters.length > 2 ? 40 : 52} fill="#8a0f5d">{letters}</text>
      <path d="M22 70C40 52 62 82 92 64" fill="none" stroke="#c9962b" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M94 66l9-3 9 26-17 5z" fill="#c2185b" />
      <path d="M94 89l17-5" stroke="#e8c877" strokeWidth="3" />
      <path d="M14 94c4-9 11-12 17-11-2 8-9 12-17 11z" fill="#c9962b" />
      <path d="M20 100c1-7 6-12 12-13 0 7-5 12-12 13z" fill="#8a0f5d" />
    </svg>
  );
}

export default function Logo({ name, logo, slogan, className = '' }: { name: string; logo?: string; slogan?: string; className?: string }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imgSrc(logo, 'm')} alt={name} className={`h-11 w-auto max-w-[46vw] object-contain md:h-14 ${className}`} />;
  }
  return (
    <span className={`inline-flex max-w-full items-center gap-2 ${className}`}>
      <Emblem letters={monogram(name)} className="h-11 w-12 shrink-0 md:h-12 md:w-14" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-serif text-[17px] font-bold uppercase tracking-wide text-ink md:text-xl">{name}</span>
        {slogan && <span className="hidden truncate text-[11px] tracking-[0.18em] text-maroon md:block">{slogan}</span>}
      </span>
    </span>
  );
}
