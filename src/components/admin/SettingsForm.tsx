'use client';
import { useActionState, startTransition } from 'react';
import { saveSettingsAction } from '@/app/admin/actions';
import type { Settings } from '@/lib/settings';

function F({ s, k, label, hint, type = 'text' }: { s: Settings; k: keyof Settings; label: string; hint?: string; type?: string }) {
  return (
    <div><label htmlFor={k}>{label}</label><input id={k} name={k} type={type} defaultValue={s[k]} />{hint && <p className="text-xs text-stone-500">{hint}</p>}</div>
  );
}

export default function SettingsForm({ s }: { s: Settings }) {
  const [st, act, pending] = useActionState(saveSettingsAction, undefined);
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); }} className="space-y-6">
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{st.error}</p>}
      {st?.ok && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{st.ok}</p>}
      <section className="card space-y-4 p-5"><h2 className="!text-lg">கடை விவரம்</h2>
        <F s={s} k="shop_name" label="கடையின் பெயர்" /><F s={s} k="tagline" label="சுருக்க வரி" /><F s={s} k="address" label="முகவரி" /><F s={s} k="city" label="ஊர்" />
        <F s={s} k="phone" label="கைபேசி" type="tel" /><F s={s} k="email" label="மின்னஞ்சல்" type="email" /><F s={s} k="hours" label="திறந்திருக்கும் நேரம்" />
        <F s={s} k="map_link" label="Google Maps இணைப்பு" />
        <F s={s} k="whatsapp" label="WhatsApp எண்" hint="எ.கா. 9876543210. நிரப்பினால் தளத்தில் WhatsApp பொத்தான் தோன்றும்; காலியாக இருந்தால் தோன்றாது." />
      </section>
      <section className="card space-y-4 p-5"><h2 className="!text-lg">முகப்புப் பதாகை</h2><F s={s} k="hero_title" label="தலைப்பு" /><F s={s} k="hero_subtitle" label="துணைத் தலைப்பு" /></section>
      <section className="card space-y-4 p-5"><h2 className="!text-lg">English (ஆங்கிலம்) — "EN" தேர்ந்தால் காட்டப்படும்</h2>
        <F s={s} k="shop_name_en" label="Shop name" /><F s={s} k="tagline_en" label="Tagline" /><F s={s} k="hero_title_en" label="Banner title" /><F s={s} k="hero_subtitle_en" label="Banner subtitle" />
        <F s={s} k="address_en" label="Address" /><F s={s} k="city_en" label="Town / city" /><F s={s} k="hours_en" label="Opening hours" />
      </section>
      <section className="card space-y-4 p-5"><h2 className="!text-lg">டெலிவரி</h2>
        <F s={s} k="delivery_fee" label="டெலிவரி கட்டணம் (₹)" hint="0 என்றால் எப்போதும் இலவசம்" /><F s={s} k="free_delivery_above" label="இந்தத் தொகைக்கு மேல் டெலிவரி இலவசம் (₹)" hint="0 என்றால் இந்த வசதி இல்லை" />
        <F s={s} k="delivery_pincodes" label="டெலிவரி செய்யும் அஞ்சல் குறியீடுகள்" hint="கமா இட்டுப் பிரிக்கவும்: 600001, 600002. காலியாக இருந்தால் அனைத்துக்கும் ஏற்கப்படும்." />
      </section>
      <section className="card space-y-4 p-5"><h2 className="!text-lg">GST</h2><F s={s} k="gstin" label="GSTIN" hint="நிரப்பினால் ரசீது 'வரி ரசீது' ஆக GST பிரிப்புடன் வரும். இல்லையெனில் சாதாரண விற்பனை ரசீது." /></section>
      <button className="btn-primary" disabled={pending}>{pending ? 'சேமிக்கிறது…' : 'சேமி'}</button>
    </form>
  );
}
