// டெமோ அட்டவணை: 8 வகைகள், 32 உடைகள். படங்கள்: public/demo/<id>-a|b-(t|m|l).webp (scripts/gen-demo-images.ts உருவாக்கும்)
import type { Spec } from '../../scripts/garments';

export const DEMO_CATEGORIES = [
  'பட்டுப் புடவைகள்',
  'பருத்திப் புடவைகள்',
  'ஃபேன்சி புடவைகள்',
  'சுடிதார் & அனார்கலி',
  'குர்தி & டாப்ஸ்',
  'பாவாடை தாவணி & லெஹெங்கா',
  'குழந்தைகள் ஆடைகள்',
  'ஆண்கள் சட்டை & வேட்டி',
] as const;

export const DEMO_CATEGORIES_EN = ['Silk Sarees', 'Cotton Sarees', 'Fancy Sarees', 'Salwar & Anarkali', 'Kurtis & Tops', 'Pavadai Davani & Lehenga', 'Kids Wear', 'Men’s Shirts & Dhoti'] as const;

type S = [string, string, number];
const FREE: S[] = [['ஒரே அளவு', 'நீளம் 5.5 மீ + Blouse piece 0.8 மீ', 3]];
const WOMEN = (a: number, b: number, c: number, d: number, e: number): S[] => [['S', 'மார்பு 34 அங்குலம்', a], ['M', 'மார்பு 36 அங்குலம்', b], ['L', 'மார்பு 38 அங்குலம்', c], ['XL', 'மார்பு 40 அங்குலம்', d], ['XXL', 'மார்பு 42 அங்குலம்', e]];
const MEN = (a: number, b: number, c: number, d: number): S[] => [['M', 'மார்பு 38 அங்குலம்', a], ['L', 'மார்பு 40 அங்குலம்', b], ['XL', 'மார்பு 42 அங்குலம்', c], ['XXL', 'மார்பு 44 அங்குலம்', d]];
const KIDS = (a: number, b: number, c: number, d: number): S[] => [['2-3 வயது', 'நீளம் 18 அங்குலம்', a], ['4-5 வயது', 'நீளம் 21 அங்குலம்', b], ['6-7 வயது', 'நீளம் 24 அங்குலம்', c], ['8-9 வயது', 'நீளம் 27 அங்குலம்', d]];
const SET: S[] = [['S', 'மார்பு 34 · இடுப்பு 28 அங்குலம்', 2], ['M', 'மார்பு 36 · இடுப்பு 30 அங்குலம்', 2], ['L', 'மார்பு 38 · இடுப்பு 32 அங்குலம்', 1]];
const DHOTI: S[] = [['M', 'சட்டை மார்பு 38 · வேட்டி 4 முழம்', 2], ['L', 'சட்டை மார்பு 40 · வேட்டி 4 முழம்', 2], ['XL', 'சட்டை மார்பு 42 · வேட்டி 4 முழம்', 2]];

export type DemoProduct = {
  id: string; name: string; desc: string; price: number; mrp: number | null; cat: number; fabric: string; color: string;
  sizes: S[]; spec: Spec; featured: boolean; gst: number; nameEn: string; descEn: string;
};
const P = (id: string, name: string, desc: string, price: number, mrp: number | null, cat: number, fabric: string, color: string, sizes: S[], spec: Spec, featured = false, gst = 5): DemoProduct =>
  ({ id, name, desc, price, mrp, cat, fabric, color, sizes, spec, featured, gst, nameEn: '', descEn: '' });
const sp = (kind: Spec['kind'], c1: string, c2: string, c3: string, pattern: Spec['pattern']): Spec => ({ kind, c1, c2, c3, pattern });

export const DEMO_PRODUCTS: DemoProduct[] = [
  // பட்டுப் புடவைகள்
  P('p01', 'காஞ்சிபுரம் பட்டுப் புடவை — மரூன்', 'தூய பட்டு, தங்க ஜரிகை பார்டர், பாரம்பரிய பூட்டா. திருமணம், விழாக்களுக்கு ஏற்றது.', 8500, 9800, 0, 'பட்டு', 'மரூன்', FREE, sp('saree', '#7a1230', '#a3304f', '#e8c766', 'dots'), true, 5),
  P('p02', 'ஆரணி பட்டுப் புடவை — பச்சை', 'இலகுவான ஆரணி பட்டு, கோவில் பார்டர்.', 5200, null, 0, 'பட்டு', 'பச்சை', FREE, sp('saree', '#0f5132', '#198754', '#e8c766', 'motif'), true),
  P('p03', 'சேலம் பட்டு — நீலம்', 'மென்மையான சேலம் பட்டு, அகலமான ஜரிகை பார்டர்.', 3900, 4500, 0, 'பட்டு', 'நீலம்', FREE, sp('saree', '#0b3c7a', '#3b82c4', '#e8c766', 'stripes'), true),
  P('p04', 'கோரா பட்டுப் புடவை — மஞ்சள்', 'திருமண மஞ்சள் நிறம், கையால் நெய்த பார்டர்.', 6400, 7200, 0, 'பட்டு', 'மஞ்சள்', FREE, sp('saree', '#d9a400', '#f2c94c', '#7a1230', 'motif')),
  P('p05', 'சில்க் காட்டன் புடவை — ஊதா', 'தினசரி & விழா இரண்டுக்கும் ஏற்றது.', 1800, 2200, 0, 'சில்க் காட்டன்', 'ஊதா', FREE, sp('saree', '#5f3dc4', '#9775fa', '#e8c766', 'dots')),
  // பருத்திப் புடவைகள்
  P('p06', 'கைத்தறிப் பருத்திப் புடவை — சிவப்பு', 'கைத்தறி பருத்தி, வெயிலுக்கு இதமானது.', 1200, null, 1, 'பருத்தி', 'சிவப்பு', FREE, sp('saree', '#b3261e', '#e0584f', '#fbf6ee', 'stripes'), true),
  P('p07', 'பருத்திப் புடவை — இளஞ்சிவப்பு', 'அலுவலகத்துக்கு ஏற்ற எளிய புடவை.', 950, 1200, 1, 'பருத்தி', 'இளஞ்சிவப்பு', FREE, sp('saree', '#d6336c', '#f783ac', '#fbf6ee', 'check')),
  P('p08', 'செட்டிநாடு காட்டன் — கருப்பு சிவப்பு', 'செட்டிநாடு பாணி கட்டம், தடிமனான பார்டர்.', 1450, null, 1, 'பருத்தி', 'கருப்பு', FREE, sp('saree', '#212529', '#b3261e', '#f1f3f5', 'check')),
  P('p09', 'கலம்காரி பருத்திப் புடவை — நீலம்', 'கைவேலைப்பாடு கலம்காரி அச்சு.', 1350, 1600, 1, 'பருத்தி', 'நீலம்', FREE, sp('saree', '#1c7ed6', '#74c0fc', '#fbf6ee', 'floral')),
  // ஃபேன்சி புடவைகள்
  P('p10', 'ஜார்ஜெட் புடவை — கருப்பு', 'பார்ட்டி வேர் ஜார்ஜெட், ஜரிகை பார்டர்.', 1500, 1900, 2, 'ஜார்ஜெட்', 'கருப்பு', FREE, sp('saree', '#212529', '#495057', '#e8c766', 'dots'), true, 5),
  P('p11', 'ஷிஃபான் புடவை — பீச்', 'இலகுவான ஷிஃபான், பூ அச்சு.', 1250, null, 2, 'ஷிஃபான்', 'பீச்', FREE, sp('saree', '#f08c6d', '#ffc9a8', '#fbf6ee', 'floral')),
  P('p12', 'ஆர்கன்சா புடவை — பச்சை', 'மின்னும் ஆர்கன்சா, எம்பிராய்டரி பார்டர்.', 2100, 2600, 2, 'ஆர்கன்சா', 'பச்சை', FREE, sp('saree', '#2b8a3e', '#69db7c', '#fbf6ee', 'motif')),
  P('p13', 'பனாரஸ் ஃபேன்சி புடவை — ஆரஞ்சு', 'பனாரஸ் பாணி நெசவு.', 2750, 3200, 2, 'ரேயான்', 'ஆரஞ்சு', FREE, sp('saree', '#e8590c', '#ffa94d', '#7a1230', 'motif')),
  // சுடிதார் & அனார்கலி
  P('p14', 'அனார்கலி சுடிதார் — பச்சை', 'துப்பட்டாவுடன் முழு செட்.', 1650, null, 3, 'ரேயான்', 'பச்சை', WOMEN(2, 3, 3, 2, 1), sp('anarkali', '#2b8a3e', '#c92a2a', '#e8c766', 'motif'), true),
  P('p15', 'நீளமான அனார்கலி — நீலம்', 'முழு flare, எம்பிராய்டரி yoke.', 2350, 2800, 3, 'ஜார்ஜெட்', 'நீலம்', WOMEN(1, 2, 2, 2, 1), sp('anarkali', '#1c4fa3', '#e8c766', '#fbf6ee', 'floral')),
  P('p16', 'சுடிதார் செட் — மஞ்சள்', 'பருத்தி சுடிதார் + துப்பட்டா.', 1100, 1400, 3, 'பருத்தி', 'மஞ்சள்', WOMEN(3, 3, 2, 2, 1), sp('anarkali', '#f2b705', '#7a1230', '#fbf6ee', 'dots')),
  P('p17', 'பட்டு சுடிதார் — மரூன்', 'விழாக்களுக்கான பட்டு சுடிதார்.', 3200, 3800, 3, 'பட்டு', 'மரூன்', WOMEN(1, 2, 2, 1, 0), sp('anarkali', '#7a1230', '#e8c766', '#e8c766', 'motif'), true),
  // குர்தி & டாப்ஸ்
  P('p18', 'பருத்தி குர்தி — ஊதா', 'வசதியான பருத்தி குர்தி, தளர்வான பொருத்தம்.', 799, 999, 4, 'பருத்தி', 'ஊதா', WOMEN(2, 3, 3, 2, 1), sp('kurti', '#5f3dc4', '#9775fa', '#f1e6c8', 'floral')),
  P('p19', 'கோடை குர்தி — இளஞ்சிவப்பு', 'இலகுவான ரேயான் குர்தி.', 699, null, 4, 'ரேயான்', 'இளஞ்சிவப்பு', WOMEN(3, 3, 3, 2, 2), sp('kurti', '#d6336c', '#faa2c1', '#fff', 'dots')),
  P('p20', 'அச்சிட்ட குர்தி — நீலம்', 'தினசரி அணிய ஏற்ற அச்சு குர்தி.', 849, 1049, 4, 'பருத்தி', 'நீலம்', WOMEN(2, 2, 3, 2, 1), sp('kurti', '#1c7ed6', '#74c0fc', '#fbf6ee', 'stripes')),
  P('p21', 'எம்பிராய்டரி குர்தி — பச்சை', 'கழுத்தில் எம்பிராய்டரி வேலைப்பாடு.', 1299, 1599, 4, 'ரேயான்', 'பச்சை', WOMEN(1, 2, 2, 2, 1), sp('kurti', '#087f5b', '#38d9a9', '#f1e6c8', 'motif')),
  // பாவாடை தாவணி & லெஹெங்கா
  P('p22', 'பட்டுப் பாவாடை தாவணி — சிவப்பு', 'பாரம்பரிய பட்டுப் பாவாடை தாவணி செட்.', 4200, 4800, 5, 'பட்டு', 'சிவப்பு', SET, sp('lehenga', '#c92a2a', '#e8c766', '#1c7ed6', 'motif'), true),
  P('p23', 'லெஹெங்கா — ரோஸ்', 'விழாக்களுக்கான எம்பிராய்டரி லெஹெங்கா.', 5600, 6500, 5, 'ஜார்ஜெட்', 'ரோஸ்', SET, sp('lehenga', '#c2255c', '#f8d7e0', '#e8c766', 'floral')),
  P('p24', 'பாவாடை தாவணி — பச்சை', 'தினசரி & கோவில் விழா செட்.', 2400, null, 5, 'சில்க் காட்டன்', 'பச்சை', SET, sp('lehenga', '#2b8a3e', '#f2c94c', '#c92a2a', 'dots')),
  // குழந்தைகள் ஆடைகள்
  P('p25', 'பட்டுப் பாவாடை சட்டை — சிவப்பு', 'குழந்தைகளுக்கான பட்டுப் பாவாடை.', 1100, 1400, 6, 'பட்டு', 'சிவப்பு', KIDS(2, 2, 0, 1), sp('frock', '#c92a2a', '#ff8787', '#e8c766', 'dots'), true),
  P('p26', 'பார்ட்டி ஃப்ராக் — இளஞ்சிவப்பு', 'வில் வைத்த பார்ட்டி ஃப்ராக்.', 899, 1199, 6, 'ஜார்ஜெட்', 'இளஞ்சிவப்பு', KIDS(3, 3, 2, 1), sp('frock', '#f783ac', '#d6336c', '#fff', 'dots')),
  P('p27', 'காட்டன் ஃப்ராக் — மஞ்சள்', 'மென்மையான பருத்தி ஃப்ராக்.', 599, null, 6, 'பருத்தி', 'மஞ்சள்', KIDS(4, 3, 3, 2), sp('frock', '#f2b705', '#ffe066', '#fff', 'floral')),
  P('p28', 'குழந்தை ஃப்ராக் — நீலம்', 'தினசரி அணியும் ஃப்ராக்.', 549, 699, 6, 'பருத்தி', 'நீலம்', KIDS(3, 4, 2, 0), sp('frock', '#4dabf7', '#a5d8ff', '#fff', 'stripes')),
  // ஆண்கள்
  P('p29', 'ஆண்கள் சட்டை — நீலம்', 'முழுக்கை பருத்திச் சட்டை, கட்டம்.', 899, null, 7, 'பருத்தி', 'நீலம்', MEN(3, 3, 2, 1), sp('shirt', '#1c7ed6', '#74c0fc', '#fff', 'check'), true),
  P('p30', 'லினன் சட்டை — பச்சை', 'கோடைக்கு ஏற்ற லினன் சட்டை.', 1299, 1599, 7, 'லினன்', 'பச்சை', MEN(2, 3, 2, 1), sp('shirt', '#2f9e44', '#8ce99a', '#fff', 'stripes')),
  P('p31', 'பட்டு வேட்டி சட்டை செட்', 'விழாக்களுக்கான வேட்டி + சட்டை.', 2400, 2800, 7, 'பட்டு', 'வெள்ளை', DHOTI, sp('dhoti', '#f1f3f5', '#dee2e6', '#b8860b', 'plain'), true, 12),
  P('p32', 'கோடு போட்ட சட்டை — சிவப்பு', 'அலுவலகத்துக்கு ஏற்ற சட்டை.', 949, 1199, 7, 'பருத்தி', 'சிவப்பு', MEN(2, 2, 2, 2), sp('shirt', '#c92a2a', '#ff8787', '#fff', 'stripes')),
];

// ஆங்கிலப் பெயர்கள், விளக்கங்கள்
const EN: Record<string, [string, string]> = {
  p01: ['Kanchipuram Silk Saree — Maroon', 'Pure silk with a gold zari border and traditional buttas. Ideal for weddings and festive occasions.'],
  p02: ['Arani Silk Saree — Green', 'Lightweight Arani silk with a temple border.'],
  p03: ['Salem Silk — Blue', 'Soft Salem silk with a wide zari border.'],
  p04: ['Kora Silk Saree — Yellow', 'Auspicious wedding yellow with a hand-woven border.'],
  p05: ['Silk Cotton Saree — Violet', 'Perfect for both everyday wear and festivals.'],
  p06: ['Handloom Cotton Saree — Red', 'Handloom cotton, comfortable in the heat.'],
  p07: ['Cotton Saree — Pink', 'A simple, elegant saree for the office.'],
  p08: ['Chettinad Cotton — Black & Red', 'Chettinad-style checks with a bold border.'],
  p09: ['Kalamkari Cotton Saree — Blue', 'Hand-crafted Kalamkari print.'],
  p10: ['Georgette Saree — Black', 'Party-wear georgette with a zari border.'],
  p11: ['Chiffon Saree — Peach', 'Light, flowing chiffon with a floral print.'],
  p12: ['Organza Saree — Green', 'Shimmering organza with an embroidered border.'],
  p13: ['Banarasi Fancy Saree — Orange', 'Banarasi-style weave.'],
  p14: ['Anarkali Salwar — Green', 'Complete set with dupatta.'],
  p15: ['Long Anarkali — Blue', 'Full flare with an embroidered yoke.'],
  p16: ['Salwar Set — Yellow', 'Cotton salwar with dupatta.'],
  p17: ['Silk Salwar — Maroon', 'Silk salwar for festive occasions.'],
  p18: ['Cotton Kurti — Violet', 'Comfortable cotton kurti with a relaxed fit.'],
  p19: ['Summer Kurti — Pink', 'Light rayon kurti.'],
  p20: ['Printed Kurti — Blue', 'A printed kurti made for everyday wear.'],
  p21: ['Embroidered Kurti — Green', 'Embroidery work around the neckline.'],
  p22: ['Silk Pavadai Davani — Red', 'Traditional silk pavadai davani set.'],
  p23: ['Lehenga — Rose', 'Embroidered lehenga for festive occasions.'],
  p24: ['Pavadai Davani — Green', 'Everyday and temple-festival set.'],
  p25: ['Silk Pavadai Sattai — Red', 'Silk pavadai for little girls.'],
  p26: ['Party Frock — Pink', 'Party frock with a bow.'],
  p27: ['Cotton Frock — Yellow', 'Soft cotton frock.'],
  p28: ['Kids Frock — Blue', 'An everyday frock.'],
  p29: ['Men’s Shirt — Blue', 'Full-sleeve cotton shirt in checks.'],
  p30: ['Linen Shirt — Green', 'A linen shirt ideal for summer.'],
  p31: ['Silk Dhoti & Shirt Set', 'Dhoti and shirt for festive occasions.'],
  p32: ['Striped Shirt — Red', 'A shirt that suits the office.'],
};
for (const p of DEMO_PRODUCTS) [p.nameEn, p.descEn] = EN[p.id] ?? ['', ''];
