import { notFound } from 'next/navigation';
import Invoice from '@/components/Invoice';
import { getOrderByToken } from '@/lib/orders';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t("ரசீது"), robots: { index: false } };
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const o = await getOrderByToken((await params).token);
  if (!o || o.status === 'cancelled') notFound();
  return <Invoice o={o} />;
}
