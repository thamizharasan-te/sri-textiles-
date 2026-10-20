// மாதிரிப் படங்கள்: ஆடை வடிவங்களை SVG-ஆக வரைந்து (புடவை, குர்தி, சுடிதார், பாவாடை, சட்டை, வேட்டி…) sharp மூலம் WebP ஆக மாற்றும்.
// உண்மைப் புகைப்படங்கள் அல்ல; நிர்வாகத்தில் உண்மைப் படங்களை ஏற்றலாம்.
export type Kind = 'saree' | 'kurti' | 'anarkali' | 'lehenga' | 'frock' | 'shirt' | 'dhoti';
export type Pattern = 'plain' | 'dots' | 'stripes' | 'check' | 'motif' | 'floral';
export type Spec = { kind: Kind; c1: string; c2: string; c3: string; pattern: Pattern };

const W = 800, H = 1000;

function pat(p: Pattern, c: string) {
  switch (p) {
    case 'dots': return `<pattern id="pt" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="23" cy="23" r="6.5" fill="${c}" opacity=".85"/><circle cx="0" cy="0" r="4" fill="${c}" opacity=".6"/><circle cx="46" cy="46" r="4" fill="${c}" opacity=".6"/></pattern>`;
    case 'stripes': return `<pattern id="pt" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="12" height="36" fill="${c}" opacity=".5"/></pattern>`;
    case 'check': return `<pattern id="pt" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="30" height="60" fill="${c}" opacity=".28"/><rect width="60" height="30" fill="${c}" opacity=".28"/></pattern>`;
    case 'motif': return `<pattern id="pt" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M32 6 L58 32 L32 58 L6 32Z" fill="none" stroke="${c}" stroke-width="3" opacity=".8"/><circle cx="32" cy="32" r="5" fill="${c}" opacity=".85"/></pattern>`;
    case 'floral': return `<pattern id="pt" width="70" height="70" patternUnits="userSpaceOnUse"><g fill="${c}" opacity=".8"><circle cx="35" cy="20" r="8"/><circle cx="50" cy="35" r="8"/><circle cx="35" cy="50" r="8"/><circle cx="20" cy="35" r="8"/></g><circle cx="35" cy="35" r="6" fill="#fff" opacity=".7"/></pattern>`;
    default: return `<pattern id="pt" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="none"/></pattern>`;
  }
}

const defs = (s: Spec) => `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f1e8"/><stop offset="1" stop-color="#e6dccd"/></linearGradient>
<linearGradient id="main" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.c1}"/><stop offset="1" stop-color="${s.c2}"/></linearGradient>
<linearGradient id="fold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="90" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<linearGradient id="zari" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${s.c3}"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="${s.c3}"/></linearGradient>
<filter id="sh" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#3b2a1a" flood-opacity=".28"/></filter>
${pat(s.pattern, s.c3)}
</defs>`;

const stage = `<rect width="${W}" height="${H}" fill="url(#bg)"/><ellipse cx="400" cy="940" rx="260" ry="22" fill="#3b2a1a" opacity=".14"/>`;

/** ஆடை வடிவம் + வடிவ overlay + மடிப்பு நிழல் */
const garment = (d: string, extra = '') =>
  `<g filter="url(#sh)"><path d="${d}" fill="url(#main)"/></g><clipPath id="gc"><path d="${d}"/></clipPath><g clip-path="url(#gc)"><rect width="${W}" height="${H}" fill="url(#pt)"/><rect width="${W}" height="${H}" fill="url(#fold)"/><rect width="${W}" height="${H}" fill="url(#shade)"/>${extra}</g><path d="${d}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`;

const hanger = `<path d="M400 96 L400 80 C400 54 436 54 436 74" stroke="#8a7a6a" fill="none" stroke-width="6" stroke-linecap="round"/><path d="M400 96 L240 152 L560 152Z" fill="none" stroke="#8a7a6a" stroke-width="6" stroke-linejoin="round"/>`;
const band = (y: number, h: number, c3: string, x = 0, w = W) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#zari)"/><rect x="${x}" y="${y + 6}" width="${w}" height="3" fill="${c3}" opacity=".9"/><rect x="${x}" y="${y + h - 9}" width="${w}" height="3" fill="${c3}" opacity=".9"/>`;

function saree(s: Spec) {
  const body = 'M110 150 Q110 130 135 130 L665 130 Q690 130 690 150 L690 850 Q690 872 665 872 L135 872 Q110 872 110 850Z';
  const extra = `${band(150, 54, s.c3)}${band(560, 46, s.c3)}
    <rect y="606" width="${W}" height="270" fill="${s.c2}" opacity=".28"/>
    <rect y="606" width="${W}" height="270" fill="url(#pt)"/>
    <path d="M110 700 Q400 640 690 700 M110 760 Q400 700 690 760 M110 820 Q400 760 690 820" stroke="${s.c3}" stroke-width="5" fill="none" opacity=".75"/>
    ${band(838, 40, s.c3)}
    <rect x="110" y="212" width="580" height="340" fill="url(#pt)" opacity=".55"/>`;
  return `${garment(body, extra)}
    <g filter="url(#sh)"><rect x="470" y="96" width="190" height="120" rx="10" fill="${s.c2}" transform="rotate(5 565 156)"/></g>
    <rect x="470" y="96" width="190" height="120" rx="10" fill="url(#fold)" transform="rotate(5 565 156)"/>
    <path d="M490 130 L640 142 M488 160 L638 172" stroke="${s.c3}" stroke-width="5" opacity=".85" transform="rotate(5 565 156)"/>`;
}

const sleeveKurta = 'M275 150 L350 150 Q400 232 450 150 L525 150 L640 330 L572 366 L535 300 L552 884 L248 884 L265 300 L228 366 L160 330Z';
function kurti(s: Spec) {
  const extra = `<path d="M350 150 Q400 232 450 150" fill="none" stroke="${s.c3}" stroke-width="12"/>
   <path d="M356 168 Q400 244 444 168" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>
   <path d="M400 232 L400 884" stroke="#000" stroke-opacity=".18" stroke-width="3"/>
   ${[250, 290, 330, 370].map((y) => `<circle cx="400" cy="${y}" r="6" fill="${s.c3}"/>`).join('')}
   <path d="M310 300 Q400 360 490 300" fill="none" stroke="${s.c3}" stroke-width="6" opacity=".85"/>
   ${band(822, 62, s.c3)}
   <path d="M252 700 L262 884 M548 700 L538 884" stroke="#000" stroke-opacity=".22" stroke-width="3"/>
   <path d="M160 330 L228 366 M640 330 L572 366" stroke="${s.c3}" stroke-width="14"/>`;
  return hanger + garment(sleeveKurta, extra);
}

function anarkali(s: Spec) {
  const d = 'M290 150 L350 150 Q400 226 450 150 L510 150 L590 300 L540 332 L500 262 L492 430 Q640 560 690 884 Q400 940 110 884 Q160 560 308 430 L300 262 L260 332 L210 300Z';
  const extra = `<path d="M350 150 Q400 226 450 150" fill="none" stroke="${s.c3}" stroke-width="12"/>
   <path d="M308 430 L492 430" stroke="${s.c3}" stroke-width="12"/>
   ${band(820, 66, s.c3)}
   <path d="M400 430 Q380 650 300 884 M400 430 Q420 650 500 884 M400 430 L400 884" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>`;
  const dup = `<g filter="url(#sh)"><path d="M262 232 Q420 330 560 520 L640 940 L560 940 L470 560 Q380 400 262 300Z" fill="${s.c2}" opacity=".96"/></g>
   <path d="M262 232 Q420 330 560 520 L640 940 L560 940 L470 560 Q380 400 262 300Z" fill="url(#fold)"/>
   <path d="M262 300 Q380 400 470 560 L560 940" fill="none" stroke="${s.c3}" stroke-width="9"/>`;
  return garment(d, extra) + dup;
}

function lehenga(s: Spec) {
  const choli = 'M300 140 L350 140 Q400 200 450 140 L500 140 L570 240 L525 272 L500 232 L505 330 L295 330 L300 232 L275 272 L230 240Z';
  const skirt = 'M310 322 L490 322 Q640 560 700 900 Q400 960 100 900 Q160 560 310 322Z';
  return `${garment(skirt, `${band(790, 110, s.c3)}<path d="M400 322 Q380 600 300 900 M400 322 Q420 600 500 900" stroke="#000" stroke-opacity=".14" stroke-width="3" fill="none"/>`)}
   <g filter="url(#sh)"><path d="${choli}" fill="${s.c2}"/></g><path d="${choli}" fill="url(#fold)"/>
   <path d="M350 140 Q400 200 450 140" stroke="${s.c3}" stroke-width="10" fill="none"/>
   <path d="M295 330 L505 330" stroke="${s.c3}" stroke-width="12"/>
   <g filter="url(#sh)"><path d="M520 160 Q330 380 250 600 L330 640 Q400 460 540 250Z" fill="${s.c3}" opacity=".92"/></g>
   <path d="M520 160 Q330 380 250 600" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>`;
}

function frock(s: Spec) {
  const d = 'M330 200 Q400 250 470 200 L500 330 Q650 540 690 800 Q400 860 110 800 Q150 540 300 330Z';
  return `${hanger.replace(/M240 152 L560 152/, 'M290 192 L510 192').replace('L240 152', 'L290 192')}
   <g filter="url(#sh)"><circle cx="300" cy="238" r="48" fill="${s.c2}"/><circle cx="500" cy="238" r="48" fill="${s.c2}"/></g>
   ${garment(d, `<rect x="300" y="322" width="200" height="22" fill="${s.c3}"/><path d="M110 800 q36 -34 72 0 t72 0 t72 0 t72 0 t72 0 t72 0 t72 0 t72 0 t72 0" stroke="${s.c3}" stroke-width="10" fill="none"/>`)}
   <g filter="url(#sh)"><path d="M400 344 L340 300 Q310 330 360 352Z M400 344 L460 300 Q490 330 440 352Z" fill="${s.c3}"/><circle cx="400" cy="344" r="15" fill="${s.c3}"/></g>`;
}

function shirt(s: Spec) {
  const d = 'M290 160 L350 140 Q400 190 450 140 L510 160 L655 330 L720 700 L640 712 L580 440 L560 880 L240 880 L220 440 L160 712 L80 700 L145 330Z';
  const extra = `<path d="M400 190 L400 880" stroke="#000" stroke-opacity=".2" stroke-width="3"/>
   <rect x="382" y="190" width="36" height="690" fill="#fff" opacity=".1"/>
   ${[250, 340, 430, 520, 610, 700, 790].map((y) => `<circle cx="400" cy="${y}" r="7" fill="#fff" opacity=".85"/><circle cx="400" cy="${y}" r="7" fill="none" stroke="#000" stroke-opacity=".3"/>`).join('')}
   <rect x="440" y="330" width="90" height="100" rx="6" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/>
   <path d="M80 700 L160 712 M720 700 L640 712" stroke="#000" stroke-opacity=".3" stroke-width="12"/>`;
  return `${garment(d, extra)}
   <g filter="url(#sh)"><path d="M350 140 L400 200 L330 224 L290 160Z M450 140 L400 200 L470 224 L510 160Z" fill="${s.c1}"/></g>
   <path d="M350 140 L400 200 L330 224 L290 160Z M450 140 L400 200 L470 224 L510 160Z" fill="url(#fold)"/>
   <path d="M350 140 L400 200 L330 224 M450 140 L400 200 L470 224" stroke="#000" stroke-opacity=".25" fill="none" stroke-width="3"/>`;
}

function dhoti(s: Spec) {
  const shirtD = 'M300 120 L350 108 Q400 150 450 108 L500 120 L610 250 L650 470 L590 480 L545 330 L540 520 L260 520 L255 330 L210 480 L150 470 L190 250Z';
  const dh = 'M170 560 L630 560 L660 900 L140 900Z';
  return `<g filter="url(#sh)"><path d="${dh}" fill="#f7f4ee"/></g><clipPath id="dc"><path d="${dh}"/></clipPath>
   <g clip-path="url(#dc)"><rect width="${W}" height="${H}" fill="url(#fold)"/>${band(560, 52, s.c3)}${band(848, 52, s.c3)}
   <path d="M330 612 Q300 760 340 848 M470 612 Q500 760 460 848" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/></g>
   ${garment(shirtD, `<path d="M400 140 L400 520" stroke="#000" stroke-opacity=".2" stroke-width="3"/>${[210, 290, 370, 450].map((y) => `<circle cx="400" cy="${y}" r="6" fill="#fff" opacity=".85"/>`).join('')}`)}`;
}

export function frontSvg(s: Spec) {
  const body = { saree, kurti, anarkali, lehenga, frock, shirt, dhoti }[s.kind](s);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(s)}${stage}${body}</svg>`;
}

/** இரண்டாம் படம்: துணியின் நெருக்கமான தோற்றம் (நெசவு, ஜரிகை, வடிவம்) */
export function detailSvg(s: Spec) {
  const weave = `<pattern id="wv" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 H8 M4 0 V8" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/></pattern>`;
  const big = s.kind === 'saree' || s.kind === 'lehenga' || s.kind === 'dhoti';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(s).replace('</defs>', weave + '</defs>')}
  <rect width="${W}" height="${H}" fill="url(#main)"/>
  <g transform="scale(1.9) translate(-40 -30)"><rect width="${W}" height="${H}" fill="url(#pt)"/></g>
  ${big ? `${band(560, 150, s.c3)}<path d="M0 760 Q400 700 800 760 M0 820 Q400 760 800 820 M0 880 Q400 820 800 880" stroke="${s.c3}" stroke-width="8" fill="none" opacity=".8"/>` : `${band(700, 120, s.c3)}`}
  <rect width="${W}" height="${H}" fill="url(#wv)"/><rect width="${W}" height="${H}" fill="url(#fold)"/>
  <radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
  <rect width="${W}" height="${H}" fill="url(#vg)"/></svg>`;
}
