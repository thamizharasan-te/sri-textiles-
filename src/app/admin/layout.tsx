export const metadata = { robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-50">{children}</div>;
}
