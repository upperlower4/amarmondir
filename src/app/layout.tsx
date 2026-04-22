import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'amarmondir | Bangladesh Temple Directory',
  description: 'Explore and contribute to the database of temples in Bangladesh.',
  icons: {
    icon: 'https://res.cloudinary.com/dhavfhslp/image/upload/v1776825083/appicon_biqz1v.png',
    apple: 'https://res.cloudinary.com/dhavfhslp/image/upload/v1776825083/appicon_biqz1v.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
