'use client';
import { useState } from 'react';
import { imgSrc } from '@/lib/img';

export default function Gallery({ images, alt }: { images: { id: number; file: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [t0, setT0] = useState<number | null>(null);
  const swipe = (end: number) => {
    if (t0 === null || images.length < 2) return;
    const d = end - t0;
    if (Math.abs(d) > 45) setI((i + (d < 0 ? 1 : -1) + images.length) % images.length);
    setT0(null);
  };
  if (!images.length) return <div className="aspect-[4/5] rounded-xl bg-gold-pale grid place-items-center text-stone-500">படம் இல்லை</div>;
  const cur = images[i];
  return (
    <div>
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gold-pale cursor-zoom-in"
        onClick={() => setZoom(true)}
        onTouchStart={(e) => setT0(e.touches[0].clientX)}
        onTouchEnd={(e) => swipe(e.changedTouches[0].clientX)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc(cur.file, 'm')} alt={alt} className="h-full w-full object-cover md:hover:scale-150 transition-transform duration-200" style={{ transformOrigin: `${pos.x}% ${pos.y}%` }} />
        <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white md:hidden">தொடு: பெரிதாக்கு · நகர்த்து: அடுத்த படம்</span>
        {images.length > 1 && <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">{images.map((im, n) => <i key={im.id} className={`h-2 w-2 rounded-full ${n === i ? "bg-white" : "bg-white/50"}`} />)}</span>}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, n) => (
            <button key={im.id} onClick={() => setI(n)} aria-label={`படம் ${n + 1}`} className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${n === i ? 'border-maroon' : 'border-transparent'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(im.file, 't')} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2" onClick={() => setZoom(false)} role="dialog" aria-label="பெரிய படம்">
          <button className="absolute right-3 top-3 rounded-full bg-white px-4 py-2 font-bold" aria-label="மூடு">✕ மூடு</button>
          {images.length > 1 && (
            <>
              <button className="absolute left-2 rounded-full bg-white/90 px-4 py-3 text-xl" aria-label="முந்தையது" onClick={(e) => { e.stopPropagation(); setI((i - 1 + images.length) % images.length); }}>‹</button>
              <button className="absolute right-2 rounded-full bg-white/90 px-4 py-3 text-xl" aria-label="அடுத்தது" onClick={(e) => { e.stopPropagation(); setI((i + 1) % images.length); }}>›</button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc(cur.file, 'l')} alt={alt} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
