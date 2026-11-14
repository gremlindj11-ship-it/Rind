import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Riverside NHS Trust – EPR | RIND Acute Pathway Intelligence',
  description:
    'RIND embedded NHS EPR prototype: One patient. One acute journey. Nothing lost.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
