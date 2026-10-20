import crypto from 'node:crypto';

// Google OAuth 2.0 (authorization code + PKCE). இணைப்பு முகவரிகளை சோதனைக்காக மட்டும் env மூலம் மாற்றலாம்.
const AUTH_URL = () => process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = () => process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const USERINFO_URL = () => process.env.GOOGLE_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo';

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Google-இல் பதிவு செய்த redirect முகவரி: SITE_URL + /api/auth/google/callback */
export const redirectUri = (origin: string) => `${(process.env.SITE_URL || origin).replace(/\/$/, '')}/api/auth/google/callback`;

const b64url = (b: Buffer) => b.toString('base64url');
export const newOAuthState = () => {
  const verifier = b64url(crypto.randomBytes(32));
  return { state: b64url(crypto.randomBytes(18)), verifier, challenge: b64url(crypto.createHash('sha256').update(verifier).digest()) };
};

export function authUrl(origin: string, state: string, challenge: string) {
  const u = new URL(AUTH_URL());
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return u.toString();
}

export type GoogleProfile = { sub: string; email: string; name: string };

export async function exchangeCode(origin: string, code: string, verifier: string): Promise<GoogleProfile> {
  const tr = await fetch(TOKEN_URL(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tr.ok) throw new Error(`Google token பிழை ${tr.status}`);
  const tok = (await tr.json()) as { access_token?: string };
  if (!tok.access_token) throw new Error('Google access token இல்லை');
  // பயனர் விவரம்: Google-இடம் நேரடியாக (TLS) கேட்கிறோம் — அதனால் நம்பகமானது
  const ur = await fetch(USERINFO_URL(), { headers: { authorization: `Bearer ${tok.access_token}` }, signal: AbortSignal.timeout(10_000) });
  if (!ur.ok) throw new Error(`Google userinfo பிழை ${ur.status}`);
  const u = (await ur.json()) as { sub?: string; email?: string; email_verified?: boolean | string; name?: string };
  if (!u.sub || !u.email) throw new Error('Google விவரம் முழுமையில்லை');
  if (u.email_verified !== true && u.email_verified !== 'true') throw new Error('Google மின்னஞ்சல் உறுதி செய்யப்படவில்லை');
  return { sub: String(u.sub), email: u.email, name: u.name || '' };
}
