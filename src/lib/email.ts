import 'server-only';
import nodemailer from 'nodemailer';
import { getSettings } from './settings';
import { rupees, PAYMENT_METHOD } from './format';
import type { OrderFull } from './orders';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendOrderEmail(o: OrderFull) {
  if (!o.email) return;
  const s = await getSettings();
  const site = process.env.SITE_URL || 'http://localhost:3000';
  const rows = o.items
    .map((i) => `<tr><td>${esc(i.name)} (அளவு: ${esc(i.size)})</td><td align="center">${i.qty}</td><td align="right">${rupees(i.price * i.qty)}</td></tr>`)
    .join('');
  const html = `<div style="font-family:sans-serif;max-width:560px;margin:auto">
<h2 style="color:#7a1230">${esc(s.shop_name)}</h2>
<p>வணக்கம் ${esc(o.name)}, உங்கள் ஆர்டருக்கு நன்றி!</p>
<p><b>ஆர்டர் எண்: ${esc(o.order_no)}</b><br>பணம் செலுத்தும் முறை: ${PAYMENT_METHOD[o.payment_method]}</p>
<table width="100%" cellpadding="6" style="border-collapse:collapse" border="1"><tr><th align="left">பொருள்</th><th>எண்ணிக்கை</th><th align="right">தொகை</th></tr>${rows}
<tr><td colspan="2">டெலிவரி</td><td align="right">${o.delivery_fee ? rupees(o.delivery_fee) : 'இலவசம்'}</td></tr>
<tr><td colspan="2"><b>மொத்தம்</b></td><td align="right"><b>${rupees(o.total)}</b></td></tr></table>
<p>முகவரி: ${esc(o.address)}, ${esc(o.city)} - ${esc(o.pincode)}</p>
<p><a href="${site}/order/${o.token}">ஆர்டர் நிலையைப் பார்க்க</a></p>
<p style="font-size:12px;color:#666">குறிப்பு: பணம் திரும்பத் தரப்படாது; அதே மதிப்புக்கு வேறு உடை மாற்றித் தரப்படும்.</p></div>`;
  await sendMail(o.email, `ஆர்டர் உறுதி — ${o.order_no} | ${s.shop_name}`, html);
}

export const smtpConfigured = () => !!process.env.SMTP_HOST;

/** மின்னஞ்சல் அனுப்பும். SMTP அமைக்கப்படாவிட்டால் false (log-இல் மட்டும் பதிவு). */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!smtpConfigured()) {
    console.log(`[மின்னஞ்சல் அமைக்கப்படவில்லை] ${to} -> ${subject}`);
    return false;
  }
  try {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
    return true;
  } catch (e) {
    console.error('மின்னஞ்சல் அனுப்ப முடியவில்லை', e);
    return false;
  }
}

export async function sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
  const s = await getSettings();
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:auto">
<h2 style="color:#7a1230">${esc(s.shop_name)}</h2>
<p>வணக்கம் ${esc(name)},</p>
<p>உங்கள் கணக்கை உறுதி செய்யும் குறியீடு:</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#7a1230;margin:12px 0">${esc(code)}</p>
<p>இது <b>10 நிமிடங்களுக்கு</b> மட்டும் செல்லும். இதை யாரிடமும் பகிர வேண்டாம்.</p>
<p style="font-size:12px;color:#666">நீங்கள் இந்தக் கணக்கைக் கோரவில்லை என்றால் இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்.</p></div>`;
  return sendMail(to, `${code} — கணக்கு உறுதிக் குறியீடு | ${s.shop_name}`, html);
}
