'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// விருப்பப் பட்டியல் (♡): உலாவியில் மட்டும் சேமிக்கப்படும்
const KEY = 'st_wish_v1';
type Ctx = { ids: number[]; has: (id: number) => boolean; toggle: (id: number) => void; ready: boolean };
const C = createContext<Ctx>({ ids: [], has: () => false, toggle: () => {}, ready: false });

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(raw)) setIds(raw.filter((x) => Number.isInteger(x)));
    } catch {}
    setReady(true);
    const sync = (e: StorageEvent) => { if (e.key === KEY) try { setIds(JSON.parse(e.newValue || '[]')); } catch {} };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggle = useCallback((id: number) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 100);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const value = useMemo(() => ({ ids, ready, toggle, has: (id: number) => ids.includes(id) }), [ids, ready, toggle]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useWishlist = () => useContext(C);
