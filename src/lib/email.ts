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
  if (!process.env.SMTP_HOST) {
    console.log(`[மின்னஞ்சல் அமைக்கப்படவில்லை] ${o.email} -> ஆர்டர் ${o.order_no}`);
    return;
  }
  try {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: o.email, subject: `ஆர்டர் உறுதி — ${o.order_no} | ${s.shop_name}`, html });
  } catch (e) {
    console.error('மின்னஞ்சல் அனுப்ப முடியவில்லை', e);
  }
}
