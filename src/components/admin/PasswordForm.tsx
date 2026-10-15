'use client';
import { useActionState, startTransition } from 'react';
import { changePasswordAction } from '@/app/admin/actions';

export default function PasswordForm() {
  const [st, act, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); }} className="card max-w-md space-y-4 p-5">
      {st?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{st.error}</p>}
      {st?.ok && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{st.ok}</p>}
      <div><label htmlFor="current">தற்போதைய கடவுச்சொல்</label><input id="current" name="current" type="password" autoComplete="current-password" required /></div>
      <div><label htmlFor="next">புதிய கடவுச்சொல் (குறைந்தது 10 எழுத்துகள்)</label><input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div><label htmlFor="confirm">புதியதை மீண்டும் உள்ளிடு</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></div>
      <button className="btn-primary" disabled={pending}>மாற்று</button>
    </form>
  );
}
