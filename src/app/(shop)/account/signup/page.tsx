import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/AuthForms';
import { currentCustomer, safeNext } from '@/lib/customer';

export const metadata = { title: 'புதிய கணக்கு', robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await currentCustomer()) redirect(next);
  return (
    <div className="container-x max-w-md py-8">
      <div className="card p-5 sm:p-7">
        <h1 className="text-center text-2xl font-bold">புதிய கணக்கை உருவாக்கு</h1>
        <p className="mt-1 text-center text-sm text-stone-600">ஆர்டர் வரலாறு, விரைவான checkout, முகவரி சேமிப்பு.</p>
        <SignupForm next={next} />
      </div>
    </div>
  );
}
