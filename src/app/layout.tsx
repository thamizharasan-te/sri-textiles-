import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getLang, getLocalizedSettings } from '@/lib/i18n-server';
import { LangProvider } from '@/components/LangProvider';

export const dynamic = 'force-dynamic';

// SITE_URL தவறாக (எ.கா. https:// இல்லாமல்) இருந்தாலும் தளம் உடையக் கூடாது
function siteUrl() {
  const raw = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return new URL('http://localhost:3000');
  }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#7a1230' };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getLocalizedSettings();
  return {
    title: { default: `${s.shop_name} — ${s.tagline}`, template: `%s | ${s.shop_name}` },
    description: s.tagline,
    metadataBase: siteUrl(),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Serif+Tamil:wght@600;700&display=swap"
        />
      </head>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
