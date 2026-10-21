'use client';
import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_LANG, makeT, type Lang, type TFn } from '@/lib/i18n';

const Ctx = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export function useT(): TFn {
  const lang = useContext(Ctx);
  return useMemo(() => makeT(lang), [lang]);
}
