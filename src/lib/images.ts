import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || './uploads');
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const VARIANTS = { t: 480, m: 960, l: 1600 } as const;
export type Variant = keyof typeof VARIANTS;

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
  fs.mkdirSync(uploadDir(), { recursive: true });
  for (const [v, w] of Object.entries(VARIANTS)) {
    await sharp(buf)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: v === 't' ? 72 : 80 })
      .toFile(path.join(uploadDir(), `${id}-${v}.webp`));
  }
  return id;
}

export function deleteProductImage(id: string) {
  if (!/^[a-f0-9]{20}$/.test(id)) return;
  for (const v of Object.keys(VARIANTS)) {
    try {
      fs.unlinkSync(path.join(uploadDir(), `${id}-${v}.webp`));
    } catch {}
  }
}

export const imgUrl = (id: string | undefined | null, v: Variant = 'm') => (id ? `/media/${id}-${v}.webp` : '/placeholder.svg');
