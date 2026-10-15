import Link from 'next/link';
import { getSettings, waLink } from '@/lib/settings';

export default function Footer() {
  const s = getSettings();
  const wa = waLink(s, 'வணக்கம், ஒரு உடை பற்றி கேட்க வேண்டும்.');
  return (
    <>
      <footer className="mt-16 bg-maroon-dark text-stone-200">
        <div className="border-motif" />
        <div className="container-x grid gap-8 py-10 md:grid-cols-3">
          <div>
            <h3 className="!text-gold-light text-xl">{s.shop_name}</h3>
            <p className="mt-2 text-sm">{s.tagline}</p>
          </div>
          <div className="text-sm">
            <h4 className="font-semibold text-white mb-2">விரைவு இணைப்புகள்</h4>
            <ul className="space-y-1">
              <li><Link href="/products" className="hover:text-gold-light">அனைத்து உடைகள்</Link></li>
              <li><Link href="/track" className="hover:text-gold-light">ஆர்டர் நிலை அறிய</Link></li>
              <li><Link href="/policy" className="hover:text-gold-light">மாற்றுக் கொள்கை & அளவு வழிகாட்டி</Link></li>
              <li><Link href="/about" className="hover:text-gold-light">எங்களைப் பற்றி</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <h4 className="font-semibold text-white mb-2">தொடர்புக்கு</h4>
            {s.address && <p>{s.address}{s.city ? ', ' + s.city : ''}</p>}
            {s.phone && <p>கைபேசி: <a href={`tel:${s.phone}`} className="hover:text-gold-light">{s.phone}</a></p>}
            {s.hours && <p>நேரம்: {s.hours}</p>}
            {s.gstin && <p>GSTIN: {s.gstin}</p>}
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} {s.shop_name}. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.</div>
      </footer>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.2 1.4z" /></svg>
        </a>
      )}
    </>
  );
}
