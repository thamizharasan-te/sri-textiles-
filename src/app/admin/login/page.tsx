import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/auth';
import LoginForm from '@/components/admin/LoginForm';
import { isDemo } from '@/lib/env';
import { DEMO_ADMIN_USER, demoAdminPassword } from '@/lib/demo';

export const metadata = { title: 'நிர்வாக உள்நுழைவு', robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin');
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-center text-2xl font-bold">கடை நிர்வாகம்</h1>
        {isDemo() && (
          <p className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-900">
            டெமோ உள்நுழைவு — பயனர்: <b>{DEMO_ADMIN_USER}</b> · கடவுச்சொல்: <b>{demoAdminPassword()}</b>
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
