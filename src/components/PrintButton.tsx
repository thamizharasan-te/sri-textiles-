'use client';
import { useT } from '@/components/LangProvider';
import { makeT, type Lang } from '@/lib/i18n';
export default function PrintButton({ lang }: { lang?: Lang }) {
  const ctx = useT();
  const t = lang ? makeT(lang) : ctx;
  return <button onClick={() => window.print()} className="btn-primary print:hidden">{t("அச்சிடு / PDF-ஆகச் சேமி")}</button>;
}
