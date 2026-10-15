import { getSettings } from '@/lib/settings';
export const metadata = { title: 'எங்களைப் பற்றி' };

export default function About() {
  const s = getSettings();
  return (
    <div className="container-x max-w-3xl py-8">
      <h1 className="text-2xl md:text-3xl font-bold">எங்களைப் பற்றி</h1>
      <div className="card mt-6 space-y-4 p-6 leading-8">
        <p><b>{s.shop_name}</b>{s.city ? `, ${s.city}` : ''} — {s.tagline}.</p>
        <p>தலைமுறைகளாக எங்கள் ஊர் மக்களுக்கு நம்பிக்கையான தரத்தில் புடவைகளையும் புதிய தைத்த ஆடைகளையும் வழங்கி வருகிறோம். இப்போது அதே தரத்தை உங்கள் வீட்டு வாசலுக்கே கொண்டு வருகிறோம்.</p>
        <p>கடைக்கு நேரில் வர முடியாதவர்களும் தொலைபேசியிலேயே பார்த்து, அளவைச் சரிபார்த்து, எளிதாக வாங்கலாம்.</p>
      </div>
    </div>
  );
}
