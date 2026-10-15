'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { productId: number; size: string; qty: number; name: string; price: number; image: string | null; max: number };
type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (i: CartItem) => void;
  setQty: (productId: number, size: string, qty: number) => void;
  remove: (productId: number, size: string) => void;
  clear: () => void;
};
const C = createContext<Ctx | null>(null);
const KEY = 'st_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((i: CartItem) => {
    setItems((cur) => {
      const f = cur.find((x) => x.productId === i.productId && x.size === i.size);
      if (f) return cur.map((x) => (x === f ? { ...x, ...i, qty: Math.min(i.max, 10, x.qty + i.qty) } : x));
      return [...cur, { ...i, qty: Math.min(i.qty, i.max, 10) }];
    });
  }, []);
  const setQty = useCallback((productId: number, size: string, qty: number) => {
    setItems((cur) => cur.map((x) => (x.productId === productId && x.size === size ? { ...x, qty: Math.max(1, Math.min(qty, x.max, 10)) } : x)));
  }, []);
  const remove = useCallback((productId: number, size: string) => {
    setItems((cur) => cur.filter((x) => !(x.productId === productId && x.size === size)));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items, ready, add, setQty, remove, clear,
      count: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.price, 0),
    }),
    [items, ready, add, setQty, remove, clear],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useCart() {
  const v = useContext(C);
  if (!v) throw new Error('CartProvider இல்லை');
  return v;
}
