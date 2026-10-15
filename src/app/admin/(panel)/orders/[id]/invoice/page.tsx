import { notFound } from 'next/navigation';
import Invoice from '@/components/Invoice';
import { getOrderById } from '@/lib/orders';

export const metadata = { title: 'ரசீது' };
export default async function AdminInvoice({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id);
  const o = Number.isNaN(id) ? undefined : getOrderById(id);
  if (!o) notFound();
  return <Invoice o={o} />;
}
