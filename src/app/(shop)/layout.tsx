import { CartProvider } from '@/components/CartProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <BottomNav />
      </WishlistProvider>
    </CartProvider>
  );
}
