'use client';
import { useT } from '@/components/LangProvider';
export default function PrintButton() {
  const t = useT();
  return <button onClick={() => window.print()} className="btn-primary print:hidden">{t("அச்சிடு / PDF-ஆகச் சேமி")}</button>;
}
