'use client';
export default function DeleteButton({ msg, children }: { msg: string; children: React.ReactNode }) {
  return <button className="btn-danger !min-h-0 !py-2" onClick={(e) => { if (!confirm(msg)) e.preventDefault(); }}>{children}</button>;
}
