import type { Metadata } from 'next';
import { getT } from '@/lib/i18n-server';
import WishlistView from '@/components/WishlistView';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t('விருப்பப் பட்டியல்'), robots: { index: false } };
}

export default async function WishlistPage() {
  const t = await getT();
  return (
    <div className="container-x py-6 md:py-10">
      <h1 className="text-2xl font-medium md:text-4xl">{t('விருப்பப் பட்டியல்')}</h1>
      <WishlistView />
    </div>
  );
}
