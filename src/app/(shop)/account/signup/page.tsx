import { redirect } from 'next/navigation';
import { GoogleButton, SignupForm } from '@/components/AuthForms';
import { oauthError } from '@/lib/oauth-errors';
import { currentCustomer, safeNext } from '@/lib/customer';
import { googleConfigured } from '@/lib/google';

export const metadata = { title: 'புதிய கணக்கு', robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const err = oauthError(sp.error);
  if (await currentCustomer()) redirect(next);
  return (
    <div className="container-x max-w-md py-8">
      <div className="card p-5 sm:p-7">
        <h1 className="text-center text-2xl font-bold">புதிய கணக்கை உருவாக்கு</h1>
        <p className="mt-1 text-center text-sm text-stone-600">ஆர்டர் வரலாறு, விரைவான checkout, முகவரி சேமிப்பு.</p>
        {err && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{err}</p>}
        {googleConfigured() && <GoogleButton next={next} label="Google மூலம் பதிவு செய்" />}
        <SignupForm next={next} />
      </div>
    </div>
  );
}
