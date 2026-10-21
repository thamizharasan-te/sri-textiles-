import { waLink } from '@/lib/settings';
import { getT, getLocalizedSettings } from '@/lib/i18n-server';
export async function generateMetadata() {
  const t = await getT();
  return { title: t("தொடர்புக்கு") };
}

export default async function Contact() {
  const t = await getT();
  const s = await getLocalizedSettings();
  const wa = waLink(s, t("வணக்கம்"));
  return (
    <div className="container-x max-w-3xl py-8">
      <h1 className="text-2xl md:text-3xl font-bold">{t("தொடர்புக்கு")}</h1>
      <div className="card mt-6 space-y-3 p-6">
        <p><b>{s.shop_name}</b></p>
        {s.address && <p>📍 {s.address}{s.city ? ', ' + s.city : ''}</p>}
        {s.phone && <p>📞 <a className="text-maroon underline" href={`tel:${s.phone}`}>{s.phone}</a></p>}
        {s.email && <p>✉️ <a className="text-maroon underline" href={`mailto:${s.email}`}>{s.email}</a></p>}
        {s.hours && <p>🕘 {s.hours}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          {s.phone && <a href={`tel:${s.phone}`} className="btn-primary">{t("அழைக்க")}</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-green-600 text-white hover:bg-green-700">WhatsApp</a>}
          {s.map_link && <a href={s.map_link} target="_blank" rel="noopener noreferrer" className="btn-outline">{t("வரைபடம்")}</a>}
        </div>
        {!s.phone && <p className="text-sm text-stone-500">{t("கடையின் தொடர்பு விவரங்கள் விரைவில் சேர்க்கப்படும்.")}</p>}
      </div>
    </div>
  );
}
