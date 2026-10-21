import { findOrderForTracking } from '@/lib/orders';
import OrderView from '@/components/OrderView';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t("ஆர்டர் நிலை அறிய"), robots: { index: false } };
}

export default async function Track({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const t = await getT();
  const sp = await searchParams;
  const no = (sp.no || '').slice(0, 20);
  const phone = (sp.phone || '').slice(0, 20);
  const searched = !!(no && phone);
  const o = searched ? await findOrderForTracking(no, phone) : undefined;
  return (
    <div className="container-x max-w-xl py-8">
      <h1 className="text-2xl md:text-3xl font-bold">{t("ஆர்டர் நிலை அறிய")}</h1>
      <form className="card mt-5 space-y-4 p-5">
        <div><label htmlFor="no">{t("ஆர்டர் எண்")}</label><input id="no" name="no" defaultValue={no} placeholder={t("எ.கா. ST1001")} required /></div>
        <div><label htmlFor="phone">{t("ஆர்டரில் கொடுத்த கைபேசி எண்")}</label><input id="phone" name="phone" defaultValue={phone} inputMode="numeric" maxLength={10} required /></div>
        <button className="btn-primary w-full">{t("நிலையைப் பார்")}</button>
      </form>
      {searched && !o && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{t("இந்த விவரங்களுடன் ஆர்டர் கிடைக்கவில்லை. எண்ணைச் சரிபார்க்கவும்.")}</p>}
      {o && <div className="mt-6"><OrderView o={o} showThanks={false} /></div>}
    </div>
  );
}
