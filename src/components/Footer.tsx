import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-white py-2">
      <div className="container mx-auto px-2">
        <div className="flex justify-between gap-2 md:gap-4">
          <div className="hidden md:block flex-1">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-sm font-bold tracking-tight text-gray-900 font-serif">
                amarmondir
              </span>
            </Link>
          </div>
          <div className="hidden md:block flex-1">
            <h3 className="font-bold text-[10px] mb-0.5">লিঙ্ক</h3>
            <ul className="flex flex-col text-[8px] text-gray-600">
              <li><Link href="/directory" className="hover:text-orange-600">মন্দির খুঁজুন</Link></li>
              <li><Link href="/leaderboard" className="hover:text-orange-600">র‍্যাঙ্কিং</Link></li>
            </ul>
          </div>
          <div className="hidden md:block flex-1">
            <h3 className="font-bold text-[10px] mb-0.5">কমিউনিটি</h3>
            <ul className="flex flex-col text-[8px] text-gray-600">
              <li><Link href="#" className="hover:text-orange-600">ফেসবুক</Link></li>
              <li><Link href="#" className="hover:text-orange-600">গাইডলাইন</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-2 pt-1 border-t text-center text-[8px] text-gray-500">
          <p>© {new Date().getFullYear()} amarmondir</p>
        </div>
      </div>
    </footer>
  );
}
