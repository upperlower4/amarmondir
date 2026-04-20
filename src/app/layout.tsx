import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Sans_Bengali, Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali' });

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
    <html lang="bn" className={cn(playfair.variable, notoBengali.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col font-sans">
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
