'use client';
import { useActionState, startTransition } from 'react';
import { loginAction } from '@/app/admin/actions';

export default function LoginForm() {
  const [st, act, pending] = useActionState(loginAction, undefined);
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); }} className="mt-5 space-y-4">
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{st.error}</p>}
      <div><label htmlFor="username">பயனர் பெயர்</label><input id="username" name="username" autoComplete="username" required /></div>
      <div><label htmlFor="password">கடவுச்சொல்</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'காத்திருக்கவும்…' : 'உள்நுழை'}</button>
    </form>
  );
}
