// விடுபட்ட மொழிபெயர்ப்புகளைக் கண்டுபிடிக்கும்: npx tsx scripts/i18n-check.ts  (விடுபட்டால் exit 1)
import { execSync } from 'node:child_process';
import { translate } from '../src/lib/i18n';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '../src/lib/demo-catalog';

const scan = JSON.parse(execSync('npx tsx scripts/i18n-scan.ts --keys', { encoding: 'utf8', maxBuffer: 1e8 })) as { keys: string[]; loose: string };
const LIBS = /^(src\/lib\/(format|filters|oauth-errors|orders|customer|verify|images)\.ts|src\/components\/(Header|BottomNav|AuthForms)\.tsx)/;
const want = new Set<string>(scan.keys);
for (const l of scan.loose as unknown as string[]) {
  const m = /^(\S+):\d+\s{2}(.*)$/.exec(l);
  if (m && LIBS.test(m[1]) && !m[2].startsWith('`')) want.add(m[2]);
}
// தரவு மதிப்புகள்: துணி, நிறம், அளவு, அளவு விவரம்
for (const p of DEMO_PRODUCTS) { want.add(p.fabric); want.add(p.color); for (const [label, detail] of p.sizes) { want.add(label); want.add(detail); } }
void DEMO_CATEGORIES;

const missing = [...want].filter((k) => k.trim() && translate('en', k) === k && /[஀-௿]/.test(k));
// {x} இடமாற்றுகள் உள்ள திறவுகோல் தன் ஆங்கிலத்திலும் அதே இடமாற்றுகளைக் கொண்டிருக்க வேண்டும்
const bad = [...want].filter((k) => { const a = (k.match(/\{\w+\}/g) || []).sort().join(), b = (translate('en', k).match(/\{\w+\}/g) || []).sort().join(); return a !== b; });
console.log(`சரிபார்த்தவை: ${want.size} · விடுபட்டவை: ${missing.length} · இடமாற்று முரண்: ${bad.length}`);
missing.forEach((k) => console.log('  ✗ விடுபட்டது:', k));
bad.forEach((k) => console.log('  ✗ இடமாற்று முரண்:', k));
process.exit(missing.length || bad.length ? 1 : 0);
