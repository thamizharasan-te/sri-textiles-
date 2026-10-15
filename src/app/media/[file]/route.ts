import fs from 'node:fs';
import path from 'node:path';
import { uploadDir } from '@/lib/images';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-f0-9]{20}-[tml]\.webp$/.test(file)) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.promises.readFile(path.join(uploadDir(), file));
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
