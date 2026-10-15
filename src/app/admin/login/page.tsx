import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/auth';
import LoginForm from '@/components/admin/LoginForm';

export const metadata = { title: 'நிர்வாக உள்நுழைவு', robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin');
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-center text-2xl font-bold">கடை நிர்வாகம்</h1>
        <LoginForm />
      </div>
    </div>
  );
}
