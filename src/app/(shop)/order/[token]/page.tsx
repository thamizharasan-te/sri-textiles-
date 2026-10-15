import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByToken } from '@/lib/orders';
import OrderView from '@/components/OrderView';

export const metadata = { title: 'ஆர்டர் நிலை', robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const o = await getOrderByToken((await params).token);
  if (!o) notFound();
  return (
    <div className="container-x max-w-3xl py-8">
      <OrderView o={o} />
      <div className="mt-6 flex flex-wrap gap-3">
        {o.status !== 'cancelled' && <Link href={`/invoice/${o.token}`} className="btn-outline">ரசீது பார்க்க</Link>}
        <Link href="/products" className="btn-primary">மேலும் வாங்க</Link>
      </div>
    </div>
  );
}
