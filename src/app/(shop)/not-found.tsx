import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <p className="text-5xl">🧵</p>
      <h1 className="mt-3 text-2xl font-bold">பக்கம் கிடைக்கவில்லை</h1>
      <Link href="/" className="btn-primary mt-6">முகப்புக்குச் செல்</Link>
    </div>
  );
}
