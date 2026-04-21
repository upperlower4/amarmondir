import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#fcfaf7] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto rotate-12">
            <Search className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-serif text-gray-900">৪MD (৪০৪)</h1>
            <p className="text-xl font-bold font-serif text-gray-600">মন্দিরটি খুঁজে পাওয়া যায়নি</p>
          </div>
          <p className="text-gray-500 bengali-text">
            আপনি যে মন্দির বা পৃষ্ঠাটি খুঁজছেন তা সম্ভবত সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল ছিল।
          </p>
          <div className="flex gap-3 justify-center">
            <Button className="bg-orange-500 rounded-xl px-8" asChild>
              <Link href="/">হোমপেজে ফিরে যান</Link>
            </Button>
            <Button variant="outline" className="rounded-xl px-8 border-orange-200 text-orange-600" asChild>
              <Link href="/directory">মন্দির খুঁজুন</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
