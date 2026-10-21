import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';
import { razorpayEnabled } from '@/lib/razorpay';
import { currentCustomer } from '@/lib/customer';
import { getT, getLocalizedSettings } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("பணம் செலுத்தும் பக்கம்") };
}

export default async function Checkout() {
  const t = await getT();
  const [s, me] = await Promise.all([getLocalizedSettings(), currentCustomer()]);
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl md:text-3xl font-bold">{t("முகவரி & பணம் செலுத்தல்")}</h1>
      <CheckoutForm customer={me ? { name: me.name, phone: me.phone, email: me.email, address: me.address, city: me.city, pincode: me.pincode } : null} fee={parseInt(s.delivery_fee) || 0} freeAbove={parseInt(s.free_delivery_above) || 0} online={razorpayEnabled()} city={s.city} />
    </div>
  );
}
