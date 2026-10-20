'use client';
import { useEffect, useState } from 'react';
import { PRICES } from '@/lib/filters';

export type FilterValues = { q: string; category: string; color: string; fabric: string; size: string; price: string; sort: string };
type Opts = { cats: { id: number; name: string }[]; colors: string[]; fabrics: string[]; sizes: string[] };

function Chips({ name, value, options }: { name: string; value: string; options: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[['', 'அனைத்தும்'] as [string, string], ...options].map(([v, l]) => (
        <label key={v} className="m-0 cursor-pointer">
          <input type="radio" name={name} value={v} defaultChecked={value === v} className="peer sr-only" />
          <span className="block min-h-[40px] rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium leading-snug peer-checked:border-maroon peer-checked:bg-maroon peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{l}</span>
        </label>
      ))}
    </div>
  );
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <fieldset className="border-b border-stone-200 py-4 first:pt-0">
    <legend className="float-left mb-2 w-full text-sm font-bold text-maroon-dark">{title}</legend><div className="clear-both" />
    {children}
  </fieldset>
);

/** தேடல் + வடிகட்டிகள். தொலைபேசியில் கீழிருந்து திறக்கும் பலகை; கணினியில் இடப்பக்கப் பட்டி. */
export default function FilterPanel({ v, opts, activeCount }: { v: FilterValues; opts: Opts; activeCount: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <form action="/search" method="get" className="md:sticky md:top-28 md:self-start" key={JSON.stringify(v)}>
      <div className="flex gap-2">
        <input name="q" defaultValue={v.q} placeholder="பெயர், நிறம், துணி…" aria-label="தேடல்" className="!min-h-[48px]" />
        <button className="btn-primary shrink-0 !px-5">தேடு</button>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline mt-3 w-full md:hidden" aria-expanded={open}>
        ⚙ வடிகட்டி{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      <div
        className={`${open ? 'fixed inset-0 z-[60] flex flex-col bg-cream' : 'hidden'} md:static md:mt-4 md:block md:rounded-xl md:border md:border-stone-200 md:bg-white md:p-4`}
        role={open ? 'dialog' : undefined}
        aria-label="வடிகட்டிகள்"
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
          <b className="text-lg">வடிகட்டிகள்</b>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-maroon" aria-label="மூடு">✕ மூடு</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:overflow-visible md:p-0">
          <Group title="வகை"><Chips name="category" value={v.category} options={opts.cats.map((c) => [String(c.id), c.name])} /></Group>
          <Group title="விலை"><Chips name="price" value={v.price} options={PRICES.slice(1)} /></Group>
          {opts.sizes.length > 0 && <Group title="அளவு"><Chips name="size" value={v.size} options={opts.sizes.map((x) => [x, x])} /></Group>}
          {opts.colors.length > 0 && <Group title="நிறம்"><Chips name="color" value={v.color} options={opts.colors.map((x) => [x, x])} /></Group>}
          {opts.fabrics.length > 0 && <Group title="துணி"><Chips name="fabric" value={v.fabric} options={opts.fabrics.map((x) => [x, x])} /></Group>}
          <Group title="வரிசை">
            <select name="sort" defaultValue={v.sort} aria-label="வரிசை">
              <option value="">புதியவை முதலில்</option>
              <option value="price_asc">விலை: குறைவு → அதிகம்</option>
              <option value="price_desc">விலை: அதிகம் → குறைவு</option>
            </select>
          </Group>
        </div>
        <div className="flex gap-2 border-t border-stone-200 bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:mt-4 md:border-0 md:bg-transparent md:p-0">
          <a href="/search" className="btn-outline flex-1">அழி</a>
          <button className="btn-primary flex-[2]" onClick={() => setOpen(false)}>முடிவுகளைக் காட்டு</button>
        </div>
      </div>
    </form>
  );
}
