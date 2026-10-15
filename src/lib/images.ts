import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { del, put } from '@vercel/blob';
import { imgSrc } from './img';

export { imgSrc };
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/sri-uploads' : './uploads'));
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const VARIANTS = { t: 480, m: 960, l: 1600 } as const;
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** DB-இல் சேமிக்கக்கூடிய சரியான பட அடையாளமா? (உள்ளூர் id அல்லது Blob URL) */
export const isValidImageRef = (f: string) =>
  /^[a-f0-9]{20}$/.test(f) || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[a-f0-9]{20}$/.test(f);

/** படத்தை WebP ஆகச் சுருக்கி 3 அளவுகளில் சேமிக்கும். படம் அல்லாத கோப்பு என்றால் பிழை. */
export async function saveProductImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('படம் 12MB-க்குள் இருக்க வேண்டும்');
  return saveImageBuffer(Buffer.from(await file.arrayBuffer()));
}

export async function saveImageBuffer(buf: Buffer): Promise<string> {
  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new Error('இது சரியான படக் கோப்பு அல்ல');
  }
  if (!meta.width || !meta.height) throw new Error('இது சரியான படக் கோப்பு அல்ல');
  const id = crypto.randomBytes(10).toString('hex');
  const outs = await Promise.all(
    Object.entries(VARIANTS).map(async ([v, w]) => ({
      v,
      data: await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: v === 't' ? 72 : 80 }).toBuffer(),
    })),
  );
  if (useBlob()) {
    let base = '';
    for (const o of outs) {
      const r = await put(`${id}-${o.v}.webp`, o.data, { access: 'public', addRandomSuffix: false, contentType: 'image/webp', cacheControlMaxAge: 31536000 });
      base = r.url.replace(/-[tml]\.webp$/, '');
    }
    return base;
  }
  fs.mkdirSync(uploadDir(), { recursive: true });
  for (const o of outs) fs.writeFileSync(path.join(uploadDir(), `${id}-${o.v}.webp`), o.data);
  return id;
}

export async function deleteProductImage(ref: string) {
  if (!isValidImageRef(ref)) return;
  try {
    if (ref.startsWith('https://')) await del(Object.keys(VARIANTS).map((v) => `${ref}-${v}.webp`));
    else for (const v of Object.keys(VARIANTS)) fs.rmSync(path.join(uploadDir(), `${ref}-${v}.webp`), { force: true });
  } catch (e) {
    console.error('படம் நீக்க முடியவில்லை', e);
  }
}
