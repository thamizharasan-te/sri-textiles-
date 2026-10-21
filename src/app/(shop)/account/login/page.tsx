import { redirect } from 'next/navigation';
import { GoogleButton, LoginForm } from '@/components/AuthForms';
import { oauthError } from '@/lib/oauth-errors';
import { currentCustomer, safeNext } from '@/lib/customer';
import { googleConfigured } from '@/lib/google';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t("உள்நுழை"), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const t = await getT();
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const err = oauthError(sp.error);
  const errText = err ? t(err) : null;
  if (await currentCustomer()) redirect(next);
  return (
    <div className="container-x max-w-md py-8">
      <div className="card p-5 sm:p-7">
        <h1 className="text-center text-2xl font-bold">{t("உள்நுழை")}</h1>
        <p className="mt-1 text-center text-sm text-stone-600">{t("உங்கள் கைபேசி எண்ணும் கடவுச்சொல்லும் போதும்.")}</p>
        {errText && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{errText}</p>}
        {googleConfigured() && <GoogleButton next={next} />}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
