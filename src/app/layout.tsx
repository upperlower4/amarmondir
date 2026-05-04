import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: {
    default: "amarmondir | Bangladesh Temple Directory",
    template: "%s | amarmondir",
  },
  description:
    "বাংলাদেশের সকল মন্দিরের তথ্য ও অবস্থান সরাসরি খুঁজে পেতে ভিজিট করুন অমর মন্দির ডিরেক্টরিতে।",
  keywords: [
    "temple",
    "bangladesh",
    "directory",
    "hindu",
    "mondir",
    "religion",
    "heritage",
  ],
  icons: {
    icon: "https://res.cloudinary.com/dhavfhslp/image/upload/v1776825083/appicon_biqz1v.png",
    apple:
      "https://res.cloudinary.com/dhavfhslp/image/upload/v1776825083/appicon_biqz1v.png",
  },
  openGraph: {
    title: "amarmondir | Bangladesh Temple Directory",
    description:
      "Explore and contribute to the database of temples in Bangladesh.",
    url: "https://amarmondir.nav.bd",
    siteName: "amarmondir",
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "amarmondir | Bangladesh Temple Directory",
    description:
      "Explore and contribute to the database of temples in Bangladesh.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Try to safely access env at runtime without next.js replacing it at build time
  const envUrl = process.env["NEXT_PUBLIC_SUPABASE_URL" as string] || "";
  const envAnonKey =
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY" as string] || "";

  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PY0XV17W3Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-PY0XV17W3Y');
          `}
        </Script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = { NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(envUrl)}, NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(envAnonKey)} };`,
          }}
        />
        <AuthProvider>
          <NotificationProvider>
            <ScrollToTop />
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
