// மாதிரிப் படங்களை உருவாக்கி public/demo-இல் சேமிக்கும். ஓட்ட: npx tsx scripts/gen-demo-images.ts
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { DEMO_PRODUCTS } from '../src/lib/demo-catalog';
import { detailSvg, frontSvg } from './garments';

const out = path.resolve('public/demo');
const VARIANTS = { t: 420, m: 820, l: 1200 } as const;

(async () => {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const p of DEMO_PRODUCTS) {
    for (const [suffix, svg] of [['a', frontSvg(p.spec)], ['b', detailSvg(p.spec)]] as const) {
      const base = await sharp(Buffer.from(svg)).png().toBuffer();
      for (const [v, w] of Object.entries(VARIANTS)) {
        await sharp(base).resize({ width: w }).webp({ quality: 68, effort: 5 }).toFile(path.join(out, `${p.id}-${suffix}-${v}.webp`));
      }
    }
    process.stdout.write(`${p.id} `);
  }
  console.log('\nமுடிந்தது ✓');
})();
