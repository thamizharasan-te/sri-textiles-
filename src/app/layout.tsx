import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#7a1230' };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.shop_name} — ${s.tagline}`, template: `%s | ${s.shop_name}` },
    description: s.tagline,
    metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Serif+Tamil:wght@600;700&display=swap"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
