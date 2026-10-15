// முழு உலாவிச் சோதனை. பயன்பாடு: தளம் ஓடும் நிலையில் BASE_URL=http://localhost:3100 ADMIN_PASSWORD=... npm test
import { chromium, type Page } from 'playwright-core';
import fs from 'node:fs';
import sharp from 'sharp';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const PASS = process.env.ADMIN_PASSWORD || '';
const SHOTS = process.env.SHOTS_DIR || '';
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(`${c ? '✓' : '✗ FAIL'} ${m}`); if (!c) fails++; };
const shot = async (p: Page, n: string) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); };

(async () => {
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ta-IN' }); // தொலைபேசி அளவு
  const p = await ctx.newPage();
  p.on('pageerror', (e) => ok(false, 'பக்கப் பிழை: ' + e.message));

  // --- வாங்குபவர் ---
  await p.goto(BASE);
  ok((await p.textContent('h1'))?.includes('பட்டின் பெருமை'), 'முகப்பு பதாகை');
  ok((await p.locator('a[href^="/products/"]').count()) >= 8, 'முகப்பில் பொருட்கள்');
  await shot(p, '01-home');
  ok((await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)), 'தொலைபேசியில் கிடைமட்ட scroll இல்லை (முகப்பு)');

  await p.goto(`${BASE}/products?category=3&sort=price_asc`);
  const names = await p.locator('article, a.card h3').allTextContents();
  ok(names.length === 2, `வகை வடிகட்டி (சுடிதார் & குர்தி = 2): ${names.length}`);
  await p.goto(`${BASE}/products?q=${encodeURIComponent('பட்டு')}&min=3000&max=9000`);
  ok((await p.locator('a.card').count()) >= 2, 'தேடல் + விலை வடிகட்டி');
  await p.goto(`${BASE}/products?size=XL&color=${encodeURIComponent('ஊதா')}`);
  ok((await p.locator('a.card').count()) === 1, 'அளவு + நிறம் வடிகட்டி');
  await shot(p, '02-list');

  // பொருள் பக்கம்: அளவு தேர்ந்தெடுக்காமல் சேர்க்க முடியாது
  await p.goto(`${BASE}/products/7`);
  await p.getByRole('button', { name: 'கூடையில் சேர்' }).click();
  ok(await p.getByText('முதலில் அளவைத் தேர்ந்தெடுக்கவும்').isVisible(), 'அளவு இல்லாமல் சேர்க்க முடியாது');
  await p.getByText('அளவு விவரங்கள்').click();
  ok(await p.getByText('மார்பு 36 அங்குலம்').first().isVisible(), 'அளவு விவரங்கள் தெரிகின்றன');
  await shot(p, '03-product');
  await p.getByRole('radio', { name: 'M' }).click();
  await p.getByRole('button', { name: 'கூடையில் சேர்' }).click();
  ok(await p.getByText('கூடையில் சேர்க்கப்பட்டது').isVisible(), 'கூடையில் சேர்ந்தது');
  // விற்றுத் தீர்ந்த அளவு முடக்கம்
  await p.goto(`${BASE}/products/9`);
  ok(await p.getByRole('radio', { name: '6-7 வயது' }).isDisabled(), 'தீர்ந்த அளவு தேர்ந்தெடுக்க முடியாது');
  // புடவை (ஒரே அளவு)
  await p.goto(`${BASE}/products/1`);
  await p.getByRole('radio', { name: 'ஒரே அளவு' }).click();
  await p.getByRole('button', { name: 'இப்போதே வாங்கு' }).click();
  await p.waitForURL('**/cart');
  ok((await p.locator('li.card').count()) === 2, 'கூடையில் 2 பொருட்கள்');
  await shot(p, '04-cart');
  await p.getByRole('link', { name: /தொடர்க/ }).click();
  await p.waitForURL('**/checkout');

  // சரிபார்ப்பு: தவறான கைபேசி
  await p.fill('#name', 'சோதனை பயனர்');
  await p.fill('#phone', '12345');
  await p.fill('#address', '12, கோவில் தெரு, சோதனை நகர்');
  await p.fill('#city', 'சோதனை ஊர்');
  await p.fill('#pincode', '600001');
  ok(await p.getByRole('button', { name: 'ஆர்டரை உறுதி செய்' }).isDisabled(), 'கொள்கை ஏற்காமல் ஆர்டர் முடியாது');
  await p.locator('input[type=checkbox]').check();
  await p.getByRole('button', { name: 'ஆர்டரை உறுதி செய்' }).click();
  await p.getByText('சரியான 10 இலக்க கைபேசி').waitFor();
  ok(true, 'தவறான கைபேசிக்குப் பிழைச் செய்தி');
  await p.fill('#phone', '9876543210');
  await shot(p, '05-checkout');
  await p.getByRole('button', { name: 'ஆர்டரை உறுதி செய்' }).click();
  await p.waitForURL('**/order/**');
  ok(await p.getByText('உங்கள் ஆர்டர் பதிவாகிவிட்டது').isVisible(), 'COD ஆர்டர் பதிவு');
  const orderNo = (await p.getByTestId('order-no').textContent())?.trim() || '';
  ok(/^ST\d+$/.test(orderNo), 'ஆர்டர் எண்: ' + orderNo);
  const orderUrl = p.url();
  await shot(p, '06-order');
  // கையிருப்பு குறைந்ததா (பொருள் 7, M: 3 → 2)
  await p.goto(`${BASE}/products/7`);
  await p.getByRole('radio', { name: 'M' }).click();
  ok(await p.getByText('இன்னும் 2 மட்டுமே உள்ளது').isVisible(), 'ஆர்டருக்குப் பின் கையிருப்பு குறைந்தது');
  // ரசீது
  await p.goto(orderUrl.replace('/order/', '/invoice/'));
  ok(await p.getByText('விற்பனை ரசீது').isVisible(), 'ரசீது (GSTIN இல்லாமல்)');
  // ஆர்டர் நிலை அறிதல்
  await p.goto(`${BASE}/track?no=${orderNo}&phone=9876543210`);
  ok(await p.getByText(orderNo).first().isVisible(), 'எண் + கைபேசியால் நிலை அறிதல்');
  await p.goto(`${BASE}/track?no=${orderNo}&phone=9000000000`);
  ok(await p.getByText('ஆர்டர் கிடைக்கவில்லை').isVisible(), 'தவறான கைபேசிக்குத் தகவல் காட்டப்படாது');

  // --- நிர்வாகம் ---
  await p.goto(`${BASE}/admin`);
  ok(p.url().includes('/admin/login'), 'உள்நுழையாமல் நிர்வாகப் பக்கம் திறக்காது');
  await p.fill('#username', 'owner');
  await p.fill('#password', 'wrong-password');
  await p.getByRole('button', { name: 'உள்நுழை' }).click();
  await p.getByText('பயனர் பெயர் அல்லது கடவுச்சொல் தவறு').waitFor();
  ok(true, 'தவறான கடவுச்சொல் மறுக்கப்பட்டது');
  await p.fill('#password', PASS);
  await p.getByRole('button', { name: 'உள்நுழை' }).click();
  await p.waitForURL(`${BASE}/admin`, { waitUntil: 'commit' });
  ok(await p.getByText('விற்பனைச் சுருக்கம்').isVisible(), 'உள்நுழைவு + சுருக்கம்');
  await shot(p, '07-admin');
  ok(await p.getByText('புதிய ஆர்டர்கள் காத்திருக்கின்றன').isVisible(), 'புதிய ஆர்டர் அறிவிப்பு');

  // வகை சேர்
  await p.goto(`${BASE}/admin/categories`);
  await p.fill('input[placeholder^="புதிய வகை"]', 'சோதனை வகை');
  await p.getByRole('button', { name: 'சேர்', exact: true }).click();
  await p.locator('input[value="சோதனை வகை"]').waitFor();
  ok(true, 'வகை சேர்க்கப்பட்டது');

  // பொருள் சேர் (படத்துடன்)
  const png = '/tmp/claude-0/e2e-test.png';
  fs.writeFileSync(png, await sharp({ create: { width: 3000, height: 3500, channels: 3, background: '#a33' } }).png().toBuffer());
  await p.goto(`${BASE}/admin/products/new`);
  await p.fill('#name', 'சோதனைப் புடவை');
  await p.fill('#price', '1999');
  await p.fill('#mrp', '1000');
  await p.setInputFiles('input[name=images]', png);
  await p.getByRole('button', { name: 'புடவை — ஒரே அளவு' }).click();
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.getByText('அசல் விலை (MRP) விற்பனை விலையை விடக் குறைவாக').waitFor();
  ok(true, 'MRP < விலை எனில் பிழை');
  await p.fill('#mrp', '2500');
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.waitForURL('**/admin/products?saved=1', { waitUntil: 'commit' });
  ok(await p.getByText('சோதனைப் புடவை').first().isVisible(), 'புதிய பொருள் சேர்ந்தது');
  // தவறான கோப்பு
  fs.writeFileSync('/tmp/claude-0/fake.png', 'not an image');
  await p.goto(`${BASE}/admin/products/new`);
  await p.fill('#name', 'போலிப் படம்');
  await p.fill('#price', '500');
  await p.getByRole('button', { name: 'புடவை — ஒரே அளவு' }).click();
  await p.setInputFiles('input[name=images]', '/tmp/claude-0/fake.png');
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.getByText('சரியான படக் கோப்பு அல்ல').waitFor();
  ok(true, 'படம் அல்லாத கோப்பு மறுக்கப்பட்டது');

  // தளத்தில் புதிய பொருள் தெரிகிறதா + சுருக்கப்பட்ட படம்
  await p.goto(`${BASE}/products?q=${encodeURIComponent('சோதனைப் புடவை')}`);
  const href = await p.locator('a.card').first().getAttribute('href');
  const imgSrc = await p.locator('a.card img').first().getAttribute('src');
  ok(!!href && !!imgSrc, 'நிர்வாகத்தில் சேர்த்தது தளத்தில் தெரிகிறது');
  const imgRes = await ctx.request.get(BASE + imgSrc!);
  ok(imgRes.ok() && imgRes.headers()['content-type'] === 'image/webp' && (await imgRes.body()).length < 60_000, `படம் WebP-ஆகச் சுருக்கப்பட்டது (${(await imgRes.body()).length} bytes)`);

  // ஆர்டர் நிலை மாற்று + ரத்து → கையிருப்பு மீள்
  await p.goto(`${BASE}/admin/orders`);
  await p.getByText(orderNo).first().click();
  await p.selectOption('#status', 'confirmed');
  await p.getByRole('button', { name: 'மாற்று' }).click();
  await p.getByText('நிலை மாற்றப்பட்டது').waitFor();
  ok(true, 'ஆர்டர் நிலை மாற்றம்');
  await p.goto(`${BASE}/track?no=${orderNo}&phone=9876543210`);
  ok(await p.getByText('உறுதி செய்யப்பட்டது').first().isVisible(), 'வாங்குபவருக்கு புதிய நிலை தெரிகிறது');
  await shot(p, '08-track');
  // GST அமைப்பு
  await p.goto(`${BASE}/admin/settings`);
  await p.fill('#gstin', 'BADGSTIN');
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.getByText('GSTIN வடிவம் தவறு').waitFor();
  ok(true, 'தவறான GSTIN மறுக்கப்பட்டது');
  await p.fill('#gstin', '33ABCDE1234F1Z5');
  await p.fill('#whatsapp', '9876543210');
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.getByText('சேமிக்கப்பட்டது ✓').waitFor();
  await p.goto(orderUrl.replace('/order/', '/invoice/'));
  ok(await p.getByText('TAX INVOICE').isVisible() && (await p.getByText('CGST').count()) > 0, 'GST ரசீது (CGST/SGST பிரிப்பு)');
  await shot(p, '09-invoice');
  await p.goto(BASE);
  ok((await p.locator('a[aria-label=WhatsApp]').count()) === 1, 'WhatsApp எண் அமைத்தால் பொத்தான் தோன்றுகிறது');
  // ரத்து
  await p.goto(`${BASE}/admin/orders`);
  await p.getByText(orderNo).first().click();
  p.once('dialog', (d) => d.accept());
  await p.selectOption('#status', 'cancelled');
  await p.getByRole('button', { name: 'மாற்று' }).click();
  await p.getByText('நிலை மாற்றப்பட்டது').waitFor();
  await p.goto(`${BASE}/products/7`);
  await p.getByRole('radio', { name: 'M' }).click();
  ok(await p.getByText('இன்னும் 3 மட்டுமே உள்ளது').isVisible(), 'ரத்துக்குப் பின் கையிருப்பு திரும்பியது');

  // கையிருப்புக்கு மேல் ஆர்டர் (race/தவறு) — கூடையை நேரடியாகக் கையாளுதல்
  await p.evaluate(() => localStorage.setItem('st_cart_v1', JSON.stringify([{ productId: 12, size: 'ஒரே அளவு', qty: 10, name: 'x', price: 1, image: null, max: 10 }])));
  await p.goto(`${BASE}/checkout`);
  await p.fill('#name', 'சோதனை');
  await p.fill('#phone', '9876543211');
  await p.fill('#address', '1, தெரு, ஊர், சோதனை');
  await p.fill('#city', 'ஊர்');
  await p.fill('#pincode', '600001');
  await p.locator('input[type=checkbox]').check();
  await p.getByRole('button', { name: 'ஆர்டரை உறுதி செய்' }).click();
  await p.getByText('கையிருப்பில் இல்லை').waitFor();
  ok(true, 'கையிருப்புக்கு மேல் ஆர்டர் மறுக்கப்பட்டது (விலையும் சேவையகத்திலேயே கணக்கு)');

  await browser.close();
  console.log(fails ? `\n${fails} சோதனைகள் தோல்வி` : '\nஅனைத்து சோதனைகளும் வெற்றி ✓');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
