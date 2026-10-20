'use client';
import Link from 'next/link';
import { startTransition, useActionState, useEffect, useState } from 'react';
import { cancelSignupAction, loginAction, profileAction, resendAction, signupAction, verifyAction, type AuthState } from '@/app/(shop)/account/actions';

type Act = (prev: AuthState, fd: FormData) => Promise<AuthState>;

function useForm(action: Act) {
  const [st, act, pending] = useActionState(action, undefined);
  // onSubmit: பிழை வந்தாலும் புலங்களில் எழுதியது அழியாது (React 19 form reset தவிர்க்க)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => act(fd));
  };
  return { st, pending, onSubmit };
}

function Field({ id, label, error, type = 'text', ...rest }: { id: string; label: string; error?: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} aria-invalid={!!error} {...rest} />
      {error && <p className="err">{error}</p>}
    </div>
  );
}

const Alert = ({ children }: { children: React.ReactNode }) => (
  <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{children}</p>
);

function PasswordField({ id, label, error, autoComplete }: { id: string; label: string; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} name={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} className="!pr-20" aria-invalid={!!error} required />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1 rounded-md px-3 py-2 text-sm text-maroon" aria-label="கடவுச்சொல்லைக் காட்டு / மறை">{show ? 'மறை' : 'காட்டு'}</button>
      </div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { st, pending, onSubmit } = useForm(signupAction);
  const f = st?.fields || {};
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      {st?.error && <Alert>{st.error}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field id="name" label="பெயர் *" autoComplete="name" error={f.name} required />
      <Field id="email" label="மின்னஞ்சல் (Gmail) *" type="email" inputMode="email" autoComplete="email" placeholder="name@gmail.com" error={f.email} required />
      <Field id="phone" label="கைபேசி எண் * (டெலிவரிக்கு)" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10 இலக்கம்" error={f.phone} required />
      <PasswordField id="password" label="கடவுச்சொல் * (குறைந்தது 8 எழுத்து)" autoComplete="new-password" error={f.password} />
      <PasswordField id="confirm" label="கடவுச்சொல்லை மீண்டும் உள்ளிடு *" autoComplete="new-password" error={f.confirm} />
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'குறியீடு அனுப்புகிறது…' : 'கணக்கை உருவாக்கு'}</button>
      <p className="text-center text-xs text-stone-500">உங்கள் மின்னஞ்சலுக்கு 6 இலக்கச் சரிபார்ப்புக் குறியீடு அனுப்பப்படும்.</p>
      <p className="text-center text-sm">ஏற்கனவே கணக்கு உள்ளதா? <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="font-semibold text-maroon underline">உள்நுழை</Link></p>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const { st, pending, onSubmit } = useForm(loginAction);
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {st?.error && <Alert>{st.error}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field id="identifier" label="மின்னஞ்சல் அல்லது கைபேசி எண்" autoComplete="username" placeholder="name@gmail.com / 10 இலக்கம்" required />
      <PasswordField id="password" label="கடவுச்சொல்" autoComplete="current-password" />
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'காத்திருக்கவும்…' : 'உள்நுழை'}</button>
      <p className="text-center text-sm">புதியவரா? <Link href={`/account/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-maroon underline">கணக்கை உருவாக்கு</Link></p>
    </form>
  );
}

export function ProfileForm({ c }: { c: { name: string; email: string; address: string; city: string; pincode: string } }) {
  const { st, pending, onSubmit } = useForm(profileAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {st?.error && <Alert>{st.error}</Alert>}
      {st?.ok && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{st.ok}</p>}
      <Field id="name" label="பெயர்" defaultValue={c.name} autoComplete="name" required />
      <div>
        <label htmlFor="email-ro">மின்னஞ்சல்</label>
        <input id="email-ro" value={c.email || '—'} readOnly disabled className="!bg-stone-100" />
      </div>
      <div><label htmlFor="address">டெலிவரி முகவரி</label><textarea id="address" name="address" rows={3} defaultValue={c.address} autoComplete="street-address" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="ஊர்" defaultValue={c.city} />
        <Field id="pincode" label="அஞ்சல் குறியீடு" inputMode="numeric" maxLength={6} defaultValue={c.pincode} />
      </div>
      <button className="btn-primary" disabled={pending}>{pending ? 'சேமிக்கிறது…' : 'சேமி'}</button>
    </form>
  );
}

export function VerifyForm({ masked, devCode, resendIn, sendsLeft }: { masked: string; devCode: string; resendIn: number; sendsLeft: number }) {
  const { st, pending, onSubmit } = useForm(verifyAction);
  const [rs, resend, resending] = useActionState(async () => resendAction(), undefined);
  const [left, setLeft] = useState(resendIn);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  useEffect(() => { if (rs?.ok) setLeft(60); }, [rs]);
  const expired = !!st?.fields?.expired;
  return (
    <div className="mt-5 space-y-4">
      {devCode && (
        <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <b>டெமோ:</b> மின்னஞ்சல் சேவை இணைக்கப்படவில்லை, அதனால் குறியீடு இங்கே தெரிகிறது: <b data-testid="dev-code" className="text-lg tracking-widest">{devCode}</b>
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        {st?.error && <Alert>{st.error}{expired && <> <Link href="/account/signup" className="font-semibold underline">மீண்டும் பதிவு செய்</Link></>}</Alert>}
        {rs?.ok && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{rs.ok}</p>}
        {rs?.error && <Alert>{rs.error}</Alert>}
        <div>
          <label htmlFor="code">சரிபார்ப்புக் குறியீடு</label>
          <input id="code" name="code" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="••••••" className="!text-center !text-2xl !tracking-[0.5em]" required autoFocus />
        </div>
        <button className="btn-primary w-full" disabled={pending}>{pending ? 'சரிபார்க்கிறது…' : 'சரிபார்த்துக் கணக்கை உருவாக்கு'}</button>
      </form>
      <form action={resend} className="text-center text-sm">
        {sendsLeft > 0 ? (
          <button className="rounded-lg px-3 py-2 font-semibold text-maroon underline disabled:text-stone-400 disabled:no-underline" disabled={left > 0 || resending}>
            {left > 0 ? `குறியீடு வரவில்லையா? ${left} விநாடியில் மீண்டும் கேட்கலாம்` : resending ? 'அனுப்புகிறது…' : 'குறியீடு வரவில்லையா? மீண்டும் அனுப்பு'}
          </button>
        ) : <span className="text-stone-500">மீண்டும் அனுப்பும் வரம்பு முடிந்தது.</span>}
      </form>
      <form action={cancelSignupAction} className="text-center text-sm">
        <button className="rounded-lg px-3 py-2 text-stone-600 underline">மின்னஞ்சலை மாற்று ({masked})</button>
      </form>
    </div>
  );
}
