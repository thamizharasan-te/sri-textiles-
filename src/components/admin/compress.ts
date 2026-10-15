/** தொலைபேசிப் படங்களை (5–10MB) உலாவியிலேயே 1600px WebP ஆகச் சுருக்கும். Vercel-இன் 4.5MB கோரிக்கை வரம்புக்காக. */
export async function compressImage(f: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.85));
    if (blob) return blob;
  } catch {
    // உலாவி ஆதரிக்கவில்லை → அசலை அனுப்பு (சேவையகம் அளவைச் சரிபார்க்கும்)
  }
  return f;
}
