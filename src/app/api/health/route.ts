import { get } from '@/lib/db';
import { isDemo } from '@/lib/env';

export const dynamic = 'force-dynamic';

// சோதனை: /api/health — தளம் ஏன் திறக்கவில்லை என்று அறிய (டெமோ முறையில் மட்டும் பிழை விவரம் காட்டும்)
export async function GET() {
  const info: Record<string, unknown> = { demo: isDemo(), node: process.version, platform: `${process.platform}-${process.arch}`, vercel: !!process.env.VERCEL };
  try {
    info.products = (await get<{ n: number }>('SELECT COUNT(*) n FROM products'))!.n;
    info.admins = (await get<{ n: number }>('SELECT COUNT(*) n FROM admins'))!.n;
    info.ok = true;
  } catch (e) {
    info.ok = false;
    info.error = isDemo() ? String((e as Error)?.stack || e).slice(0, 1500) : 'database error';
  }
  try {
    const sharp = (await import('sharp')).default;
    info.sharp = sharp.versions.sharp;
  } catch (e) {
    info.sharp = 'FAILED: ' + (isDemo() ? String((e as Error)?.message || e).slice(0, 300) : 'error');
  }
  return Response.json(info, { status: info.ok ? 200 : 500 });
}
