// படம்: "demo/p01-a" → /demo/p01-a-m.webp (நிலையான கோப்பு), உள்ளூர் id → /media/…, Vercel Blob → முழு URL அடிப்படை (https://…/id)
export type Variant = 't' | 'm' | 'l';

export const imgSrc = (file: string | undefined | null, v: Variant = 'm') =>
  !file ? '/placeholder.svg' : file.startsWith('https://') ? `${file}-${v}.webp` : file.startsWith('demo/') ? `/${file}-${v}.webp` : `/media/${file}-${v}.webp`;
