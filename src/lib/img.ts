// படம்: உள்ளூர் என்றால் id (எ.கா. "ab12…") → /media/..., Vercel Blob என்றால் முழு URL அடிப்படை (https://…/id)
export type Variant = 't' | 'm' | 'l';

export const imgSrc = (file: string | undefined | null, v: Variant = 'm') =>
  !file ? '/placeholder.svg' : file.startsWith('https://') ? `${file}-${v}.webp` : `/media/${file}-${v}.webp`;
