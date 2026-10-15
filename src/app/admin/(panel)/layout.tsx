import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '../actions';

const LINKS = [
  ['/admin', 'சுருக்கம்'],
  ['/admin/orders', 'ஆர்டர்கள்'],
  ['/admin/products', 'பொருட்கள்'],
  ['/admin/categories', 'வகைகள்'],
  ['/admin/settings', 'கடை அமைப்புகள்'],
  ['/admin/password', 'கடவுச்சொல்'],
];

export default async function Panel({ children }: { children: React.ReactNode }) {
  const a = await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-20 bg-maroon-dark text-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <b className="font-serif">நிர்வாகம்</b>
          <span className="text-xs text-stone-300">{a.username}</span>
          <Link href="/" target="_blank" className="ml-auto text-sm underline">தளத்தைப் பார்</Link>
          <form action={logoutAction}><button className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">வெளியேறு</button></form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {LINKS.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-white/10">{l}</Link>)}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </>
  );
}
