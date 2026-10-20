// "Google மூலம் தொடர்க" சோதனை: போலி Google (OAuth) சேவையகத்துடன். 
// பயன்பாடு: தளத்தை GOOGLE_CLIENT_ID=test-client GOOGLE_CLIENT_SECRET=test-secret GOOGLE_AUTH_URL=http://localhost:3400/auth
//   GOOGLE_TOKEN_URL=http://localhost:3400/token GOOGLE_USERINFO_URL=http://localhost:3400/userinfo SITE_URL=http://localhost:3100 உடன் இயக்கி: npx tsx scripts/e2e-google.ts
import crypto from 'node:crypto';
import http from 'node:http';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
let fails = 0;
const ok = (c: unknown, m: string) => { console.log(`${c ? '✓' : '✗ FAIL'} ${m}`); if (!c) fails++; };

// ---- போலி Google ----
let mode: 'ok' | 'unverified' | 'deny' = 'ok';
let who = { sub: 'g-1001', email: 'Priya.Test@Gmail.com', name: 'பிரியா சோதனை' };
const codes = new Map<string, { challenge: string; redirect: string }>();
const srv = http.createServer((req, res) => {
  const u = new URL(req.url!, 'http://x');
  if (u.pathname === '/auth') {
    const redirect = u.searchParams.get('redirect_uri')!;
    if (u.searchParams.get('client_id') !== 'test-client' || u.searchParams.get('code_challenge_method') !== 'S256' || !u.searchParams.get('code_challenge') || u.searchParams.get('scope') !== 'openid email profile') { res.writeHead(400).end('bad auth request'); return; }
    const back = new URL(redirect);
    back.searchParams.set('state', u.searchParams.get('state')!);
    if (mode === 'deny') back.searchParams.set('error', 'access_denied');
    else { const code = crypto.randomBytes(8).toString('hex'); codes.set(code, { challenge: u.searchParams.get('code_challenge')!, redirect }); back.searchParams.set('code', code); }
    res.writeHead(302, { location: back.toString() }).end();
  } else if (u.pathname === '/token' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
      const f = new URLSearchParams(body);
      const c = codes.get(f.get('code') || '');
      const verifierOk = c && crypto.createHash('sha256').update(f.get('code_verifier') || '').digest('base64url') === c.challenge;
      if (!c || !verifierOk || f.get('client_secret') !== 'test-secret' || f.get('redirect_uri') !== c.redirect || f.get('grant_type') !== 'authorization_code') { res.writeHead(400, { 'content-type': 'application/json' }).end('{"error":"invalid_grant"}'); return; }
      codes.delete(f.get('code')!);
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ access_token: 'tok-' + who.sub, token_type: 'Bearer' }));
    });
  } else if (u.pathname === '/userinfo') {
    if (req.headers.authorization !== 'Bearer tok-' + who.sub) { res.writeHead(401).end(); return; }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ...who, email_verified: mode !== 'unverified' }));
  } else res.writeHead(404).end();
});

(async () => {
  await new Promise<void>((r) => srv.listen(3400, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();

  await p.goto(`${BASE}/account/login`);
  ok(await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).isVisible(), 'உள்நுழைவுப் பக்கத்தில் Google பொத்தான்');
  await p.goto(`${BASE}/account/signup`);
  ok(await p.getByRole('link', { name: /Google மூலம் பதிவு செய்/ }).isVisible(), 'sign up பக்கத்தில் Google பொத்தான்');
  await p.screenshot({ path: '/tmp/claude-0/shots/13-google-signup.png' });

  // 1) புதிய கணக்கு
  await p.getByRole('link', { name: /Google மூலம் பதிவு செய்/ }).click();
  await p.getByRole('heading', { name: /வணக்கம், பிரியா/ }).waitFor();
  ok(await p.getByText('priya.test@gmail.com').isVisible() && await p.getByText('✓ உறுதி').isVisible(), 'Google வழியாகப் புதிய கணக்கு: மின்னஞ்சல் (lowercase) + உறுதி குறி');
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);

  // 2) அதே கணக்கில் மீண்டும் (புதிய நகல் உருவாகக் கூடாது) + next
  await p.goto(`${BASE}/account/login?next=${encodeURIComponent('/cart')}`);
  await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).click();
  await p.waitForURL('**/cart');
  ok(true, 'மீண்டும் Google உள்நுழைவு → next=/cart');
  await p.goto(`${BASE}/account`);
  ok(await p.getByRole('heading', { name: /வணக்கம், பிரியா/ }).isVisible(), 'அதே கணக்கு');
  // விவரங்களில் கைபேசி சேர்
  await p.fill('#phone', '9' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0'));
  await p.getByRole('button', { name: 'சேமி' }).click();
  await p.getByText('சேமிக்கப்பட்டது ✓').waitFor();
  ok(true, 'Google கணக்குக்குக் கைபேசி எண் சேர்க்க முடிந்தது');
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);

  // 3) வெளி முகவரிக்குத் திசைதிருப்ப முடியாது
  await p.goto(`${BASE}/api/auth/google?next=${encodeURIComponent('https://evil.example')}`);
  await p.waitForURL(`${BASE}/account`);
  ok(p.url().startsWith(BASE), 'next=வெளி முகவரி புறக்கணிக்கப்பட்டது');
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);

  // 4) state CSRF: நேரடி callback
  await p.goto(`${BASE}/api/auth/google/callback?code=abc&state=forged`);
  ok(p.url().includes('error=google_state'), 'போலி state மறுக்கப்பட்டது');
  ok(await p.getByRole('alert').filter({ hasText: 'நேரம் முடிந்துவிட்டது' }).isVisible(), 'பிழைச் செய்தி காட்டப்படுகிறது');

  // 5) Google மின்னஞ்சல் உறுதியில்லை
  mode = 'unverified';
  await p.goto(`${BASE}/account/login`);
  await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).click();
  await p.waitForURL('**/account/login?error=google');
  ok(true, 'உறுதி செய்யப்படாத Google மின்னஞ்சல் மறுக்கப்பட்டது');

  // 6) பயனர் மறுத்தால்
  mode = 'deny';
  await p.goto(`${BASE}/account/login`);
  await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).click();
  await p.waitForURL('**/account/login?error=google_denied');
  ok(await p.getByText('ரத்து செய்யப்பட்டது').isVisible(), 'Google-இல் மறுத்தால் தெளிவான செய்தி');

  // 7) ஏற்கனவே உள்ள (மின்னஞ்சல் வழி) கணக்குடன் இணைதல்
  mode = 'ok';
  who = { sub: 'g-2002', email: 'link.me@gmail.com', name: 'இணை சோதனை' };
  await p.goto(`${BASE}/account/signup`);
  // நேரடியாக DB-இல் கணக்கு உருவாக்காமல், Google வழியாக இருமுறை நுழைந்து ஒரே கணக்கா என்று பார்க்கிறோம்
  await p.getByRole('link', { name: /Google மூலம் பதிவு செய்/ }).click();
  await p.getByRole('heading', { name: /வணக்கம், இணை/ }).waitFor();
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);
  who = { sub: 'g-2002', email: 'link.me@gmail.com', name: 'வேறு பெயர்' };
  await p.goto(`${BASE}/account/login`);
  await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).click();
  await p.getByRole('heading', { name: /வணக்கம், இணை/ }).waitFor();
  ok(true, 'அதே Google அடையாளம் → அதே கணக்கு (பெயர் மாறாது)');

  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);
  // 8) மின்னஞ்சல்+குறியீடு வழிக் கணக்கு இருந்தால், அதே மின்னஞ்சலுடன் Google நுழைவு அதனுடன் இணைகிறது
  const phone2 = '9' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
  await p.goto(`${BASE}/account/signup`);
  await p.fill('#name', 'முதல் பெயர்'); await p.fill('#email', 'same.mail@gmail.com'); await p.fill('#phone', phone2); await p.fill('#password', 'Secret-Pass-1'); await p.fill('#confirm', 'Secret-Pass-1');
  await p.getByRole('button', { name: 'கணக்கை உருவாக்கு' }).click();
  await p.waitForURL('**/account/verify');
  await p.fill('#code', (await p.getByTestId('dev-code').textContent())!.trim());
  await p.getByRole('button', { name: /சரிபார்த்துக்/ }).click();
  await p.getByRole('heading', { name: /வணக்கம், முதல்/ }).waitFor();
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);
  who = { sub: 'g-3003', email: 'Same.Mail@gmail.com', name: 'கூகுள் பெயர்' };
  await p.goto(`${BASE}/account/login`);
  await p.getByRole('link', { name: /Google மூலம் தொடர்க/ }).click();
  await p.getByRole('heading', { name: /வணக்கம், முதல்/ }).waitFor();
  ok(await p.inputValue('#phone') === phone2, 'Google நுழைவு, உள்ள மின்னஞ்சல் கணக்குடன் இணைந்தது (கைபேசி, பெயர் அப்படியே)');
  await p.getByRole('button', { name: 'வெளியேறு' }).click(); await p.waitForURL(`${BASE}/`);
  await p.goto(`${BASE}/account/login`);
  await p.fill('#identifier', 'same.mail@gmail.com'); await p.fill('#password', 'Secret-Pass-1');
  await p.getByRole('button', { name: 'உள்நுழை', exact: true }).click();
  await p.getByRole('heading', { name: /வணக்கம், முதல்/ }).waitFor();
  ok(true, 'இணைந்த பிறகும் கடவுச்சொல்லால் உள்நுழையலாம்');

  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} சோதனைகள் தோல்வி` : '\nGoogle சோதனைகள் அனைத்தும் வெற்றி ✓');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
