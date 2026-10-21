import { getT } from '@/lib/i18n-server';
export async function generateMetadata() {
  const t = await getT();
  return { title: t("மாற்றுக் கொள்கை & அளவு வழிகாட்டி") };
}

export default async function Policy() {
  const t = await getT();
  return (
    <div className="container-x max-w-3xl py-8">
      <h1 className="text-2xl md:text-3xl font-bold">{t("மாற்றுக் கொள்கை & அளவு வழிகாட்டி")}</h1>
      <section className="card mt-6 space-y-3 p-6">
        <h2 className="!text-xl">{t("மாற்றுக் கொள்கை")}</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><b>{t("பணம் திரும்பத் தரப்படாது (No Refund).")}</b></li>
          <li>{t("வாங்கிய உடையின் மதிப்புக்குச் சமமான தொகைக்கு")} <b>{t("வேறு உடை மாற்றித் தரப்படும்")}</b>.</li>
          <li>{t("மாற்றும் உடை பயன்படுத்தப்படாமலும், துவைக்கப்படாமலும், அசல் நிலையிலும் இருக்க வேண்டும்.")}</li>
          <li>{t("மாற்ற விரும்புவோர் டெலிவரி பெற்ற நாளிலிருந்து குறிப்பிட்ட நாட்களுக்குள் கடையைத் தொடர்பு கொள்ளவும்.")}</li>
          <li>{t("புதிய உடையின் விலை அதிகமாக இருந்தால் வித்தியாசத் தொகையைச் செலுத்தலாம்.")}</li>
        </ul>
      </section>
      <section className="card mt-6 space-y-3 p-6">
        <h2 className="!text-xl">{t("அளவு தேர்ந்தெடுக்கும் முன்")}</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("ஒவ்வொரு உடையின் பக்கத்திலும்")} <b>{t("\"அளவு விவரங்கள்\"")}</b>  {t("உள்ளது. அளவைத் தேர்ந்தெடுக்காமல் கூடையில் சேர்க்க முடியாது.")}</li>
          <li>{t("உங்கள் உடலளவை அளந்து, உடையின் அளவு விவரத்துடன் ஒப்பிடுங்கள்.")}</li>
          <li>{t("சந்தேகம் இருந்தால் ஆர்டர் செய்யும் முன் கடையை அழைத்துக் கேளுங்கள்.")}</li>
          <li>{t("புடவைகள் பொதுவாக ஒரே அளவு (Free Size); நீளம், blouse piece விவரம் பொருளின் பக்கத்தில் இருக்கும்.")}</li>
        </ul>
      </section>
    </div>
  );
}
