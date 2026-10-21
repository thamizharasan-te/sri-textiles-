// மொழிபெயர்க்கப்படாத தமிழ்ச் சொற்களைப் பட்டியலிடும் (AST). --keys: t() திறவுகோல்கள் + பட்டியல் நிலையான சொற்கள் JSON-ஆக.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const TAMIL = /[஀-௿]/;
const SKIP = [/\/admin\//, /components\/admin\//, /demo-catalog\.ts$/, /i18n-en\.ts$/, /\/db\.ts$/, /\/demo\.ts$/, /scripts\//];
const files: string[] = [];
(function walk(d: string) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f.name) && !SKIP.some((r) => r.test(p))) files.push(p);
  }
})('src');

const wantKeys = process.argv.includes('--keys');
const keys = new Set<string>();      // t('…') முதல் வாதம்
const loose: string[] = [];          // t() வெளியே உள்ள தமிழ்

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n: ts.Node) => {
    const isLit = ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n) || ts.isJsxText(n);
    if (isLit) {
      const text = ts.isTemplateExpression(n) ? n.getText(sf) : ts.isJsxText(n) ? n.text : (n as ts.StringLiteral).text;
      if (TAMIL.test(text)) {
        const par = n.parent;
        const isTArg = par && ts.isCallExpression(par) && ts.isIdentifier(par.expression) && par.expression.text === 't' && par.arguments[0] === n;
        if (isTArg) keys.add(text);
        else if (!(ts.isJsxText(n) && !TAMIL.test(n.text))) loose.push(`${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}  ${text.trim().replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
if (wantKeys) console.log(JSON.stringify({ keys: [...keys], loose }, null, 1));
else { console.log(loose.join('\n')); console.log(`\nt() திறவுகோல்கள்: ${keys.size} · மொழிபெயர்க்கப்படாதவை: ${loose.length}`); }
