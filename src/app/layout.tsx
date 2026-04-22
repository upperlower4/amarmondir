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
  // Try to safely access env at runtime without next.js replacing it at build time
  const envUrl = process.env['NEXT_PUBLIC_SUPABASE_URL' as string] || '';
  const envAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY' as string] || '';

  return (
    <html lang="bn">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = { NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(envUrl)}, NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(envAnonKey)} };`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
