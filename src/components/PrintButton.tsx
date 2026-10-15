'use client';
export default function PrintButton() {
  return <button onClick={() => window.print()} className="btn-primary print:hidden">அச்சிடு / PDF-ஆகச் சேமி</button>;
}
