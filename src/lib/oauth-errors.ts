const ERRORS: Record<string, string> = {
  google_off: 'Google உள்நுழைவு இன்னும் இணைக்கப்படவில்லை.',
  google_denied: 'Google உள்நுழைவு ரத்து செய்யப்பட்டது.',
  google_state: 'உள்நுழைவு நேரம் முடிந்துவிட்டது. மீண்டும் முயலவும்.',
  google: 'Google உள்நுழைவு தோல்வி. மீண்டும் முயலவும் அல்லது மின்னஞ்சலால் உள்நுழையவும்.',
};
export const oauthError = (code?: string) => (code ? ERRORS[code] || null : null);

