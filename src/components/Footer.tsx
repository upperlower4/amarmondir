import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold tracking-tight text-gray-900 font-serif">
                <Image src="https://res.cloudinary.com/dhavfhslp/image/upload/v1776825082/horizontal_logo_ysoot5.png" alt="Amar Mondir" width={180} height={32} className="h-8 w-auto" referrerPolicy="no-referrer" />
              </span>
            </Link>
            <p className="text-gray-600 max-w-sm bengali-text leading-relaxed">
              বাংলাদেশের সকল মন্দিরের তথ্য নিয়ে একটি সমৃদ্ধ ডিরেক্টরি। আমরা আমাদের ঐতিহ্য ও সংস্কৃতিকে সকলের কাছে পৌঁছে দিতে কাজ করছি।
            </p>
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-4">লিঙ্ক</h3>
            <ul className="space-y-2 text-sm text-gray-600 bengali-text">
              <li><Link href="/directory" className="hover:text-orange-600">মন্দির খুঁজে দেখুন</Link></li>
              <li><Link href="/leaderboard" className="hover:text-orange-600">অবদানকারী তালিকা</Link></li>
              <li><Link href="/add-temple" className="hover:text-orange-600">নতুন মন্দির যোগ করুন</Link></li>
              <li><Link href="/login" className="hover:text-orange-600">লগ ইন</Link></li>
            </ul>
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-4">কমিউনিটি</h3>
            <ul className="space-y-2 text-sm text-gray-600 bengali-text">
              <li><Link href="https://www.facebook.com/groups/sonatoni.bondhuder.addakhana" className="hover:text-orange-600">ফেসবুক গ্রুপ</Link></li>
              <li><Link href="#" className="hover:text-orange-600">গাইডলাইন</Link></li>
              <li><Link href="#" className="hover:text-orange-600">যোগাযোগ</Link></li>
            </ul>
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-4">আমাদের পার্টনার</h3>
            <ul className="space-y-2 text-sm text-gray-600 bengali-text">
              <li><Link href="https://www.facebook.com/groups/sonatoni.bondhuder.addakhana" className="hover:text-orange-600"><img src="" alt="sponsor 1"></img></Link></li>
              <li><Link href="https://www.facebook.com/groups/sonatoni.bondhuder.addakhana" className="hover:text-orange-600"><img src="" alt="sponsor 1"></img></Link></li>
              <li><Link href="https://www.facebook.com/groups/sonatoni.bondhuder.addakhana" className="hover:text-orange-600"><img src="" alt="sponsor 1"></img></Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} amarmondir. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
