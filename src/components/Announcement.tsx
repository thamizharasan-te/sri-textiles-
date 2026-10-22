import { getLang, getT } from '@/lib/i18n-server';
import { getSettings } from '@/lib/settings';
import { rupees } from '@/lib/format';

/** மேலே ஓடும் இளஞ்சிவப்புச் செய்திப் பட்டை */
export default async function Announcement() {
  const t = await getT();
  const lang = await getLang();
  const s = await getSettings();
  const custom = (lang === 'en' ? s.announcement_en || s.announcement : s.announcement).split('|').map((x) => x.trim()).filter(Boolean);
  const free = parseInt(s.free_delivery_above) || 0;
  const items = custom.length
    ? custom
    : [
        free > 0 ? t('{amt}-க்கு மேல் இலவச டெலிவரி', { amt: rupees(free) }) : t('உள்ளூர் டெலிவரி'),
        t('உயர்தரம்'),
        t('பொருள் கிடைத்ததும் பணம் (COD)'),
        t('எளிதான மாற்று வசதி'),
      ];
  const row = [...items, ...items, ...items];
  const Half = ({ hidden }: { hidden?: boolean }) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {row.map((x, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6 text-sm font-medium">{x}</span>
          <span aria-hidden className="text-xs text-gold-light">{i % 2 ? '★' : '✦'}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-maroon py-2 text-white" role="region" aria-label={t('அறிவிப்புகள்')}>
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <Half />
        <Half hidden />
      </div>
    </div>
  );
}
