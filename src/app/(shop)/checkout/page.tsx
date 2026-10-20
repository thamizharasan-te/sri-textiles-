import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';
import { getSettings } from '@/lib/settings';
import { razorpayEnabled } from '@/lib/razorpay';
import { currentCustomer } from '@/lib/customer';

export const metadata: Metadata = { title: 'பணம் செலுத்தும் பக்கம்' };

export default async function Checkout() {
  const [s, me] = await Promise.all([getSettings(), currentCustomer()]);
  return (
    <div className="container-x py-8">
      <h1 className="text-2xl md:text-3xl font-bold">முகவரி & பணம் செலுத்தல்</h1>
      <CheckoutForm customer={me ? { name: me.name, phone: me.phone, email: me.email, address: me.address, city: me.city, pincode: me.pincode } : null} fee={parseInt(s.delivery_fee) || 0} freeAbove={parseInt(s.free_delivery_above) || 0} online={razorpayEnabled()} city={s.city} />
    </div>
  );
}
