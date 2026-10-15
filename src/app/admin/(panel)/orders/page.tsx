import Link from 'next/link';
import { db } from '@/lib/db';
import { ORDER_STATUS, PAYMENT_STATUS, formatDate, rupees } from '@/lib/format';

export const metadata = { title: 'ஆர்டர்கள்' };
type Row = { id: number; order_no: string; name: string; phone: string; total: number; status: string; payment_method: string; payment_status: string; created_at: string };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const where: string[] = [];
  const args: string[] = [];
  if (sp.status && sp.status in ORDER_STATUS) { where.push('status = ?'); args.push(sp.status); }
  if (sp.q) { where.push('(order_no LIKE ? OR name LIKE ? OR phone LIKE ?)'); const l = `%${sp.q.slice(0, 40)}%`; args.push(l, l, l); }
  const rows = db().prepare(`SELECT id,order_no,name,phone,total,status,payment_method,payment_status,created_at FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 200`).all(...args) as Row[];
  return (
    <div>
      <h1 className="text-2xl font-bold">ஆர்டர்கள்</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 ${!sp.status ? 'bg-maroon text-white' : 'bg-white border'}`}>அனைத்தும்</Link>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (<Link key={k} href={`/admin/orders?status=${k}`} className={`rounded-full px-3 py-1 ${sp.status === k ? 'bg-maroon text-white' : 'bg-white border'}`}>{v}</Link>))}
      </div>
      <form className="mt-3"><input name="q" defaultValue={sp.q} placeholder="ஆர்டர் எண் / பெயர் / கைபேசி…" />{sp.status && <input type="hidden" name="status" value={sp.status} />}</form>
      <div className="mt-4 space-y-2">
        {rows.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-3 hover:shadow-md">
            <div><b className="text-maroon">{o.order_no}</b> · {o.name} · {o.phone}<p className="text-xs text-stone-500">{formatDate(o.created_at)} · {o.payment_method === 'cod' ? 'COD' : 'ஆன்லைன்'} ({PAYMENT_STATUS[o.payment_status]})</p></div>
            <div className="text-right"><b>{rupees(o.total)}</b><p className="text-xs">{ORDER_STATUS[o.status]}</p></div>
          </Link>
        ))}
        {!rows.length && <p className="card p-8 text-center text-stone-500">ஆர்டர்கள் இல்லை</p>}
      </div>
    </div>
  );
}
