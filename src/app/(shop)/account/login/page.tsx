import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/AuthForms';
import { currentCustomer, safeNext } from '@/lib/customer';

export const metadata = { title: 'உள்நுழை', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await currentCustomer()) redirect(next);
  return (
    <div className="container-x max-w-md py-8">
      <div className="card p-5 sm:p-7">
        <h1 className="text-center text-2xl font-bold">உள்நுழை</h1>
        <p className="mt-1 text-center text-sm text-stone-600">உங்கள் கைபேசி எண்ணும் கடவுச்சொல்லும் போதும்.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
