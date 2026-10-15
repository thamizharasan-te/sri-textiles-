'use client';
import { useActionState, useRef, useState, startTransition } from 'react';
import { saveProduct, uploadImageAction } from '@/app/admin/actions';
import { compressImage } from './compress';
import { imgSrc } from '@/lib/img';
import type { Category, Product, Size } from '@/lib/queries';

type Row = { label: string; detail: string; stock: string };
const PRESETS: Record<string, Row[]> = {
  'புடவை — ஒரே அளவு': [{ label: 'ஒரே அளவு', detail: 'நீளம் 5.5 மீ + Blouse piece 0.8 மீ', stock: '1' }],
  'ஆடை — S முதல் XL': ['S', 'M', 'L', 'XL'].map((l) => ({ label: l, detail: '', stock: '1' })),
  'ஆடை — S முதல் XXL': ['S', 'M', 'L', 'XL', 'XXL'].map((l) => ({ label: l, detail: '', stock: '1' })),
  'குழந்தைகள் வயது': ['2-3 வயது', '4-5 வயது', '6-7 வயது', '8-9 வயது'].map((l) => ({ label: l, detail: '', stock: '1' })),
};

export default function ProductForm({ cats, product, images = [], sizes = [] }: { cats: Category[]; product?: Product; images?: { id: number; file: string }[]; sizes?: Size[] }) {
  const [st, act, pending] = useActionState(saveProduct, undefined);
  const [rows, setRows] = useState<Row[]>(sizes.length ? sizes.map((s) => ({ label: s.label, detail: s.detail, stock: String(s.stock) })) : [{ label: '', detail: '', stock: '1' }]);
  const upd = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState('');
  const [localErr, setLocalErr] = useState('');
  const uploaded = useRef(new Map<string, string>());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setLocalErr('');
    const fd = new FormData(e.currentTarget);
    fd.delete('images'); // பெரிய கோப்புகளை அனுப்ப வேண்டாம்; கீழே ஒவ்வொன்றாக ஏற்றுகிறோம்
    for (const [i, f] of files.entries()) {
      const key = `${f.name}|${f.size}|${f.lastModified}`;
      let id = uploaded.current.get(key);
      if (!id) {
        setBusy(`படம் ${i + 1}/${files.length} ஏற்றுகிறது…`);
        const u = new FormData();
        u.set('file', await compressImage(f), 'photo.webp');
        const r = await uploadImageAction(u);
        if (!r.id) { setBusy(''); setLocalErr(r.error || 'படம் ஏற்ற முடியவில்லை'); return; }
        uploaded.current.set(key, r.id);
        id = r.id;
      }
      fd.append('new_image', id);
    }
    setBusy('சேமிக்கிறது…');
    startTransition(async () => { await act(fd); setBusy(''); });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {(localErr || st?.error) && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{localErr || st?.error}</p>}

      <section className="card space-y-4 p-5">
        <h2 className="!text-lg">அடிப்படை விவரம்</h2>
        <div><label htmlFor="name">பொருளின் பெயர் *</label><input id="name" name="name" defaultValue={product?.name} required maxLength={150} placeholder="எ.கா. காஞ்சிபுரம் பட்டுப் புடவை — மரூன்" /></div>
        <div><label htmlFor="description">விளக்கம்</label><textarea id="description" name="description" rows={4} defaultValue={product?.description} maxLength={3000} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="category_id">வகை</label>
            <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ''}><option value="">— வகை இல்லை —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            {!cats.length && <p className="text-xs text-stone-500">முதலில் "வகைகள்" பக்கத்தில் வகைகளைச் சேர்க்கவும்.</p>}</div>
          <div><label htmlFor="gst_rate">GST விகிதம்</label>
            <select id="gst_rate" name="gst_rate" defaultValue={product?.gst_rate ?? 5}>{[0, 5, 12, 18].map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
          <div><label htmlFor="price">விற்பனை விலை (₹, GST உட்பட) *</label><input id="price" name="price" type="number" min="1" inputMode="numeric" defaultValue={product?.price} required /></div>
          <div><label htmlFor="mrp">அசல் விலை (₹ — சலுகை காட்ட, விருப்பம்)</label><input id="mrp" name="mrp" type="number" min="0" inputMode="numeric" defaultValue={product?.mrp ?? ''} /></div>
          <div><label htmlFor="fabric">துணி</label><input id="fabric" name="fabric" defaultValue={product?.fabric} placeholder="பட்டு / பருத்தி / சில்க் காட்டன்…" list="fabrics" /><datalist id="fabrics">{['பட்டு', 'பருத்தி', 'சில்க் காட்டன்', 'ஜார்ஜெட்', 'ஷிஃபான்', 'லினன்', 'ரேயான்'].map((f) => <option key={f} value={f} />)}</datalist></div>
          <div><label htmlFor="color">நிறம்</label><input id="color" name="color" defaultValue={product?.color} placeholder="சிவப்பு / நீலம்…" list="colors" /><datalist id="colors">{['சிவப்பு', 'மரூன்', 'பச்சை', 'நீலம்', 'மஞ்சள்', 'இளஞ்சிவப்பு', 'ஊதா', 'கருப்பு', 'வெள்ளை', 'ஆரஞ்சு'].map((f) => <option key={f} value={f} />)}</datalist></div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 font-normal"><input type="checkbox" name="featured" defaultChecked={!!product?.featured} className="h-5 w-5" /> சிறப்புப் பொருள் (முகப்பில் காட்டு)</label>
          <label className="flex items-center gap-2 font-normal"><input type="checkbox" name="active" defaultChecked={product ? !!product.active : true} className="h-5 w-5" /> விற்பனையில் உள்ளது</label>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="!text-lg">அளவுகளும் கையிருப்பும் *</h2>
        <p className="text-sm text-stone-600">ஒவ்வொரு அளவுக்கும் எத்தனை உள்ளன என்று எழுதவும். வாடிக்கையாளர் அளவைத் தேர்ந்தெடுக்காமல் வாங்க முடியாது.</p>
        <div className="flex flex-wrap gap-2">{Object.entries(PRESETS).map(([k, v]) => (<button type="button" key={k} onClick={() => setRows(v.map((x) => ({ ...x })))} className="rounded-full border border-maroon px-3 py-1 text-sm text-maroon hover:bg-gold-pale">{k}</button>))}</div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_auto] gap-2 sm:grid-cols-[140px_1fr_90px_auto]">
              <input name="size_label" value={r.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="அளவு (M)" aria-label="அளவு" maxLength={30} />
              <input name="size_stock" type="number" min="0" inputMode="numeric" value={r.stock} onChange={(e) => upd(i, 'stock', e.target.value)} aria-label="கையிருப்பு" className="sm:order-3" />
              <input name="size_detail" value={r.detail} onChange={(e) => upd(i, 'detail', e.target.value)} placeholder="அளவு விவரம் (மார்பு 38 அங்குலம்…)" aria-label="அளவு விவரம்" maxLength={200} className="col-span-3 sm:col-span-1 sm:order-2" />
              <button type="button" onClick={() => setRows((x) => x.filter((_, n) => n !== i))} className="rounded-lg px-3 text-red-700 hover:bg-red-50 sm:order-4" aria-label="அளவை நீக்கு">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((x) => [...x, { label: '', detail: '', stock: '1' }])} className="btn-outline !min-h-0 !py-2 text-sm">+ அளவு சேர்</button>
        <div><label htmlFor="size_info">பொதுவான அளவு வழிகாட்டி (எல்லா அளவுகளுக்கும்)</label><textarea id="size_info" name="size_info" rows={3} defaultValue={product?.size_info} placeholder="எ.கா. அளவுகள் அங்குலத்தில். தளர்வான பொருத்தம்." maxLength={1500} /></div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="!text-lg">படங்கள் {!product && '*'}</h2>
        <p className="text-sm text-stone-600">அதிகபட்சம் 8 படங்கள். படங்கள் தானாகவே சுருக்கப்படும். தொலைபேசியில் எடுத்த படங்களையே நேரடியாகச் சேர்க்கலாம்.</p>
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {images.map((im, n) => (
              <div key={im.id} className="rounded-lg border p-1 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc(im.file, 't')} alt="" className="aspect-[4/5] w-full rounded object-cover" />
                <label className="mt-1 flex items-center gap-1 font-normal"><input type="radio" name="main_image" value={im.id} defaultChecked={false} /> முதன்மை{n === 0 && ' ✓'}</label>
                <label className="flex items-center gap-1 font-normal text-red-700"><input type="checkbox" name="remove_image" value={im.id} /> நீக்கு</label>
              </div>
            ))}
          </div>
        )}
        <input type="file" name="images" accept="image/*" multiple onChange={(e) => { const fl = Array.from(e.target.files ?? []); setFiles(fl); setPreviews(fl.map((f) => URL.createObjectURL(f))); }} />
        {previews.length > 0 && <div className="flex gap-2 overflow-x-auto">{previews.map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={p} src={p} alt="" className="h-24 rounded" />)}</div>}
      </section>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t bg-stone-50/95 px-4 py-3 backdrop-blur">
        <button className="btn-primary flex-1 sm:flex-none" disabled={pending || !!busy}>{busy || (pending ? 'சேமிக்கிறது…' : 'சேமி')}</button>
        <a href="/admin/products" className="btn-outline">ரத்து</a>
      </div>
    </form>
  );
}
