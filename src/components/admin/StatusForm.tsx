'use client';
import { useActionState, startTransition } from 'react';
import { updateOrderStatus } from '@/app/admin/actions';
import { ORDER_STATUS } from '@/lib/format';

export default function StatusForm({ id, status }: { id: number; status: string }) {
  const [st, act, pending] = useActionState(updateOrderStatus, undefined);
  const locked = status === 'cancelled';
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); }} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="status">ஆர்டர் நிலை</label>
      <div className="flex gap-2">
        <select id="status" name="status" defaultValue={status} disabled={locked}>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-primary shrink-0" disabled={pending || locked}>மாற்று</button>
      </div>
      {st?.error && <p className="err" role="alert">{st.error}</p>}
      {st?.ok && <p className="text-sm text-green-700" role="status">{st.ok}</p>}
      <p className="text-xs text-stone-500">"ரத்து" தேர்ந்தால் கையிருப்பு தானாகத் திரும்பச் சேரும். ரத்தானதை மீண்டும் மாற்ற முடியாது.</p>
    </form>
  );
}
