import { redirect } from 'next/navigation';
import { VerifyForm } from '@/components/AuthForms';
import { currentCustomer } from '@/lib/customer';
import { pendingInfo } from '@/lib/verify';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t("மின்னஞ்சல் சரிபார்ப்பு"), robots: { index: false } };
}

export default async function VerifyPage() {
  const t = await getT();
  if (await currentCustomer()) redirect('/account');
  const info = await pendingInfo();
  if (!info) redirect('/account/signup');
  return (
    <div className="container-x max-w-md py-8">
      <div className="card p-5 sm:p-7">
        <h1 className="text-center text-2xl font-bold">{t("மின்னஞ்சலை உறுதி செய்யுங்கள்")}</h1>
        <p className="mt-2 text-center text-sm text-stone-600">
          <b className="break-all">{info.masked}</b>  {t("முகவரிக்கு 6 இலக்கக் குறியீடு அனுப்பியுள்ளோம். Inbox-இல் இல்லையென்றால் Spam / Promotions-ஐயும் பாருங்கள். குறியீடு 10 நிமிடம் செல்லும்.")}
        </p>
        <VerifyForm masked={info.masked} devCode={info.devCode} resendIn={info.resendIn} sendsLeft={info.sendsLeft} />
      </div>
    </div>
  );
}
