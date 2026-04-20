import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'amarmondir | Bangladesh Temple Directory',
  description: 'Explore and contribute to the database of temples in Bangladesh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col font-sans bg-white text-gray-900 overflow-x-hidden">
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
