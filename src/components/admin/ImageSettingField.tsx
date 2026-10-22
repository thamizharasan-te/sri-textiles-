'use client';
import { useState } from 'react';
import { uploadImageAction } from '@/app/admin/actions';
import { imgSrc } from '@/lib/img';
import { compressImage } from './compress';

/** ஒரு பட அமைப்பு (லோகோ, பதாகை): தேர்ந்தால் உலாவியிலேயே சுருக்கி ஏற்றும்; அடையாளம் மறைந்த புலத்தில் சேமிக்கப்படும் */
export default function ImageSettingField({ name, label, hint, value }: { name: string; label: string; hint?: string; value: string }) {
  const [ref, setRef] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.set('file', await compressImage(f), 'photo.webp');
    const r = await uploadImageAction(fd);
    setBusy(false);
    if (r.id) setRef(r.id); else setErr(r.error || 'படம் ஏற்ற முடியவில்லை');
  }
  return (
    <div>
      <label htmlFor={`f-${name}`}>{label}</label>
      <input type="hidden" name={name} value={ref} />
      <div className="flex items-center gap-3">
        {ref && /* eslint-disable-next-line @next/next/no-img-element */ <img src={imgSrc(ref, 't')} alt="" className="h-20 w-16 rounded border object-cover" />}
        <div className="min-w-0 flex-1">
          <input id={`f-${name}`} type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} />
          {busy && <p className="text-sm text-stone-500">ஏற்றுகிறது…</p>}
          {err && <p className="err">{err}</p>}
          {ref && <button type="button" onClick={() => setRef('')} className="mt-1 text-sm text-red-700 underline">நீக்கு</button>}
        </div>
      </div>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
