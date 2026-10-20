import { NextResponse, type NextRequest } from 'next/server';
import { authUrl, googleConfigured, newOAuthState } from '@/lib/google';
import { safeNext } from '@/lib/customer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!googleConfigured()) return NextResponse.redirect(new URL('/account/login?error=google_off', origin));
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  const { state, verifier, challenge } = newOAuthState();
  const res = NextResponse.redirect(authUrl(origin, state, challenge));
  // state + PKCE verifier + next: 10 நிமிடம் மட்டும், JS-க்குத் தெரியாது
  res.cookies.set('st_oauth', JSON.stringify({ state, verifier, next }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/auth/google', maxAge: 600 });
  return res;
}
