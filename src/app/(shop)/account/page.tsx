import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/AuthForms';
import { currentCustomer, customerOrders } from '@/lib/customer';
import { ORDER_STATUS, formatDate, rupees } from '@/lib/format';
import { logoutAction } from './actions';
import { getT } from '@/lib/i18n-server';
import { getLang } from '@/lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t("என் கணக்கு"), robots: { index: false } };
}

export default async function Account() {
  const t = await getT();
  const lang = await getLang();
  const me = await currentCustomer();
  if (!me) redirect('/account/login?next=/account');
  const orders = await customerOrders(me.id);
  return (
    <div className="container-x max-w-3xl py-6 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{t("வணக்கம்,")} {me.name}</h1><p className="text-sm text-stone-600">{me.email && <>{me.email} <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{t("✓ உறுதி")}</span> </>}{me.phone && <>  {t("· கைபேசி:")} {me.phone}</>}</p></div>
        <form action={logoutAction}><button className="btn-outline !min-h-[40px] !px-4 text-sm">{t("வெளியேறு")}</button></form>
      </div>
      <section className="mt-6">
        <h2 className="!text-xl">{t("என் ஆர்டர்கள்")}</h2>
        <div className="mt-3 space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/order/${o.token}`} className="card flex items-center justify-between gap-3 p-4 hover:shadow-md">
              <div><b className="text-maroon">{o.order_no}</b><p className="text-xs text-stone-500">{formatDate(o.created_at, lang)}</p></div>
              <div className="text-right"><b>{rupees(o.total)}</b><p className="text-xs">{t(ORDER_STATUS[o.status])}</p></div>
            </Link>
          ))}
          {!orders.length && (
            <div className="card p-8 text-center text-stone-600">{t("இன்னும் ஆர்டர்கள் இல்லை.")} <Link href="/products" className="font-semibold text-maroon underline">{t("உடைகளைப் பார்க்க")}</Link></div>
          )}
        </div>
      </section>
      <section className="card mt-8 p-5">
        <h2 className="!text-xl mb-4">{t("என் விவரங்கள்")}</h2>
        <ProfileForm c={me} />
      </section>
    </div>
  );
}
