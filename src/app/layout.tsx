import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'amarmondir | Bangladesh Temple Directory',
  description: 'Explore and contribute to the database of temples in Bangladesh.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>
        {children}
      </body>
    </html>
  );
}
