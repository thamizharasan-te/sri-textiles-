export const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const ORDER_STATUS: Record<string, string> = {
  new: 'புதிய ஆர்டர்',
  confirmed: 'உறுதி செய்யப்பட்டது',
  packed: 'தயாராகிறது',
  out: 'வழியில் உள்ளது',
  delivered: 'கொடுக்கப்பட்டது',
  cancelled: 'ரத்து செய்யப்பட்டது',
};
export const STATUS_FLOW = ['new', 'confirmed', 'packed', 'out', 'delivered'] as const;

export const PAYMENT_METHOD: Record<string, string> = {
  cod: 'பொருள் கிடைத்ததும் பணம் (COD)',
  razorpay: 'ஆன்லைன் பணம் (Razorpay)',
};
export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'செலுத்தப்படவில்லை',
  paid: 'செலுத்தப்பட்டது',
  failed: 'தோல்வி',
};

export function formatDate(s: string) {
  // SQLite CURRENT_TIMESTAMP is UTC "YYYY-MM-DD HH:MM:SS"
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('ta-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
