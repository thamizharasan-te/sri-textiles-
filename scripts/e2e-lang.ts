// தமிழ் ↔ English மாற்றச் சோதனை. பயன்பாடு: BASE_URL=http://localhost:3100 npx tsx scripts/e2e-lang.ts
import { chromium, type Page } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const SHOTS = process.env.SHOTS_DIR || '';
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(`${c ? '✓' : '✗ FAIL'} ${m}`); if (!c) fails++; };
const TAMIL = /[஀-௿]+/g;
// மொழி மாற்றிப் பொத்தான்கள் தன் மொழியிலேயே இருக்கும் (வழக்கம்) — அவற்றைத் தவிர்க்கிறோம்
const TOGGLE = new Set(['தமிழ்', 'தமிழுக்கு', 'மாற்று', 'மொழி']);
const tamilLeft = async (p: Page) => ((await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[placeholder],[aria-label],[alt],[title]')].map((e) => ['placeholder', 'aria-label', 'alt', 'title'].map((a) => e.getAttribute(a) || '').join(' ')).join(' '))).match(TAMIL) || []).filter((w) => !TOGGLE.has(w));

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => ok(false, 'பக்கப் பிழை: ' + e.message + ' @ ' + p.url()));

  // இயல்புநிலை English (தமிழ் வேண்டுபவர் மாற்றிக்கொள்ளலாம்)
  await p.goto(BASE);
  ok((await p.getAttribute('html', 'lang')) === 'en', 'இயல்புநிலை மொழி: English');
  ok(await p.getByRole('link', { name: /Shop now/ }).first().isVisible(), 'முதல் வருகையிலேயே English பதாகை');
  ok((await p.locator('h1').first().textContent())?.includes('TR Cloth Store'), 'English முகப்புத் தலைப்பு (கடை அமைப்பிலிருந்து)');
  ok(await p.getByRole('link', { name: /TR Cloth Store/i }).first().isVisible(), 'கடைப் பெயர் English');
  ok((await p.title()).includes('TR Cloth Store'), 'பக்கத் தலைப்பு (tab) English');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/20-en-home.png` });
  // தொலைபேசி: ஒரே பொத்தான் → தமிழ்
  await p.getByRole('button', { name: 'தமிழுக்கு மாற்று' }).first().click();
  await p.waitForFunction(() => document.documentElement.lang === 'ta');
  ok((await p.locator('h1').first().textContent())?.includes('டிஆர்'), 'தமிழுக்கு மாற்றினால் தமிழ் தலைப்பு');
  ok((await p.title()).includes('டிஆர் கிளாத் ஸ்டோர்'), 'தமிழ்: பக்கத் தலைப்பு');
  await p.getByRole('button', { name: 'Switch to English' }).first().click();
  await p.waitForFunction(() => document.documentElement.lang === 'en');
  ok(await p.getByRole('link', { name: /Shop now/ }).first().isVisible(), 'மீண்டும் English');

  // பக்கங்களில் தமிழ் எஞ்சவில்லை
  const pages = ['/', '/products', '/products?category=2', '/products/1', '/products/25', '/search', '/search?category=4&price=1000-2000&size=M', '/search?q=nomatchxyz', '/cart', '/checkout', '/track', '/track?no=ST9999&phone=9876543210', '/about', '/contact', '/policy', '/account/login', '/account/signup', '/account/login?error=google_denied', '/no-such-page'];
  for (const path of pages) {
    await p.goto(BASE + path);
    await p.waitForLoadState('networkidle');
    const left = await tamilLeft(p);
    ok(left.length === 0, `English: ${path} — தமிழ் எஞ்சவில்லை${left.length ? ' ✗ ' + [...new Set(left)].slice(0, 6).join(' | ') : ''}`);
  }
  // தரவு: பொருள் பெயர், வகை, துணி, அளவு விவரம்
  await p.goto(`${BASE}/products/1`);
  ok((await p.locator('h1').textContent())?.trim() === 'Kanchipuram Silk Saree — Maroon', 'பொருள் பெயர் English');
  ok(await p.getByText('Silk', { exact: true }).first().isVisible() && await p.getByText('Maroon', { exact: true }).first().isVisible(), 'துணி, நிறம் English');
  await p.getByText('Size details').first().click();
  ok(await p.getByText('Length 5.5 m + 0.8 m blouse piece').first().isVisible(), 'அளவு விவரம் English');
  await p.goto(`${BASE}/products/18`);
  await p.getByText('Size details').first().click();
  ok(await p.getByText('Chest 36 in').first().isVisible(), 'அளவு விவரம் (எண் வடிவம்) English');
  await p.goto(`${BASE}/products/25`);
  ok(await p.getByRole('radio', { name: '2-3 yrs' }).isVisible(), 'குழந்தை அளவு "2-3 yrs"');

  // English வடிகட்டிப் பலகை
  await p.goto(`${BASE}/search`);
  await p.getByRole('button', { name: /Filters/ }).click();
  ok(await p.getByRole('dialog').getByText('Silk Sarees').first().isVisible() && await p.getByRole('dialog').getByText('Maroon').first().isVisible(), 'வடிகட்டிப் பலகை English (வகை, நிறம்)');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/21-en-filters.png` });
  await p.getByRole('dialog').getByText('Silk', { exact: true }).last().click().catch(() => {});
  await p.getByRole('button', { name: 'Show results' }).click();

  // English-இல் வாங்குதல்
  await p.goto(`${BASE}/products/18`);
  await p.getByRole('button', { name: 'Add to cart' }).first().click();
  ok(await p.getByText('Please select a size first').isVisible(), 'English: அளவு தேர்வு எச்சரிக்கை');
  await p.getByRole('radio', { name: 'M' }).click();
  await p.getByRole('button', { name: 'Add to cart' }).first().click();
  ok(await p.getByText('Added to cart ✓').isVisible(), 'English: கூடையில் சேர்ந்தது');
  await p.goto(`${BASE}/cart`);
  ok(await p.getByText('Cotton Kurti — Violet').first().isVisible(), 'கூடையில் English பெயர்');
  ok(await tamilLeft(p).then((l) => l.length === 0), 'கூடையில் (பொருளுடன்) தமிழ் இல்லை');
  await p.getByRole('link', { name: /Continue — address/ }).click();
  await p.waitForURL('**/checkout');
  await p.fill('#name', 'Test Buyer'); await p.fill('#phone', '12345'); await p.fill('#address', '12, Temple Street, Test Town'); await p.fill('#city', 'Town'); await p.fill('#pincode', '600001');
  await p.locator('input[type=checkbox]').check();
  await p.getByRole('button', { name: 'Place order' }).click();
  await p.getByText('Enter a valid 10-digit mobile number').waitFor();
  ok(true, 'English: சரிபார்ப்புப் பிழைச் செய்தி (சேவையகத்திலிருந்து)');
  await p.fill('#phone', '9876543210');
  await p.getByRole('button', { name: 'Place order' }).click();
  await p.waitForURL('**/order/**');
  ok(await p.getByText(/Thank you, Test Buyer/).isVisible(), 'English: ஆர்டர் பதிவு நன்றி');
  ok(await tamilLeft(p).then((l) => l.length === 0), 'ஆர்டர் பக்கத்தில் தமிழ் இல்லை');
  ok(await p.getByText('New order').first().isVisible(), 'English ஆர்டர் நிலை');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/22-en-order.png`, fullPage: true });
  const inv = p.url().replace('/order/', '/invoice/');
  await p.goto(inv);
  ok(await p.getByText('SALES RECEIPT').isVisible() && await tamilLeft(p).then((l) => l.length === 0), 'English ரசீது');
  // கையிருப்புக்கு மேல் → English பிழை
  await p.evaluate(() => localStorage.setItem('st_cart_v1', JSON.stringify([{ productId: 12, size: 'ஒரே அளவு', qty: 10, name: 'x', price: 1, image: null, max: 10 }])));
  await p.waitForTimeout(300);
  await p.goto(`${BASE}/checkout`);
  await p.fill('#name', 'Test Buyer'); await p.fill('#phone', '9876543211'); await p.fill('#address', '1, Street, Town, Test'); await p.fill('#city', 'Town'); await p.fill('#pincode', '600001');
  await p.locator('input[type=checkbox]').check();
  await p.getByRole('button', { name: 'Place order' }).click();
  await p.getByText(/is not available in the quantity you need/).waitFor();
  ok((await p.getByRole('alert').first().textContent())?.includes('Organza Saree — Green') && (await p.getByRole('alert').first().textContent())?.includes('Free size'), 'English: கையிருப்புப் பிழை (பொருள் பெயர், அளவு English)');

  // Sign up பிழைகள் English
  await p.goto(`${BASE}/account/signup`);
  await p.fill('#name', 'A'); await p.fill('#email', 'bad'); await p.fill('#phone', '1'); await p.fill('#password', 'short'); await p.fill('#confirm', 'x');
  await p.getByRole('button', { name: 'Create account' }).click();
  await p.getByText('There are some errors in the form').waitFor();
  ok(await tamilLeft(p).then((l) => l.length === 0), 'Sign up பிழைகள் English');

  // நிலைத்தன்மை: தமிழுக்கு மாற்றினால் புதிய பக்கங்களிலும் தமிழ்; மீண்டும் English
  await p.goto(BASE);
  await p.getByRole('button', { name: 'தமிழுக்கு மாற்று' }).first().click();
  await p.waitForFunction(() => document.documentElement.lang === 'ta');
  await p.goto(`${BASE}/products`);
  ok((await p.getAttribute('html', 'lang')) === 'ta' && (await p.locator('h1').first().textContent())?.includes('அனைத்து உடைகள்'), 'தமிழ் தேர்வு புதிய பக்கங்களிலும் நிலைக்கிறது (cookie)');
  await p.goto(`${BASE}/admin/login`);
  ok((await p.locator('h1').first().textContent())?.includes('கடை நிர்வாகம்'), 'நிர்வாக உள்நுழைவு தமிழில்');

  // கணினி வடிவம்: இரு பகுதிப் பொத்தான்
  const d = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await d.goto(BASE);
  const seg = d.getByRole('group', { name: /Language/ }).first();
  ok(await seg.isVisible(), 'கணினியில் தமிழ் | EN பொத்தான்கள்');
  ok((await seg.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')) === 'true', 'English முதலில் தேர்வாகியுள்ளது');
  await seg.getByRole('button', { name: 'தமிழ்' }).click();
  await d.waitForFunction(() => document.documentElement.lang === 'ta');
  ok((await seg.getByRole('button', { name: 'தமிழ்' }).getAttribute('aria-pressed')) === 'true', 'தமிழ் தேர்வு காட்டப்படுகிறது');
  if (SHOTS) await d.screenshot({ path: `${SHOTS}/23-ta-desktop.png` });

  await b.close();
  console.log(fails ? `\n${fails} சோதனைகள் தோல்வி` : '\nமொழிச் சோதனைகள் அனைத்தும் வெற்றி ✓');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
