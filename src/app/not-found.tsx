import Link from 'next/link';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <CartProvider>
      <Header />
      <main className="container-x py-20 text-center">
        <p className="text-5xl">🧵</p>
        <h1 className="mt-3 text-2xl font-bold">பக்கம் கிடைக்கவில்லை</h1>
        <p className="mt-2 text-stone-600">நீங்கள் தேடிய பக்கம் இல்லை அல்லது நீக்கப்பட்டிருக்கலாம்.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">முகப்புக்குச் செல்</Link>
          <Link href="/products" className="btn-outline">அனைத்து உடைகள்</Link>
        </div>
      </main>
      <Footer />
    </CartProvider>
  );
}
