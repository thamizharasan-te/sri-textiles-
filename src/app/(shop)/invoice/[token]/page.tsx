import { notFound } from 'next/navigation';
import Invoice from '@/components/Invoice';
import { getOrderByToken } from '@/lib/orders';

export const metadata = { title: 'ரசீது', robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const o = getOrderByToken((await params).token);
  if (!o || o.status === 'cancelled') notFound();
  return <Invoice o={o} />;
}
