import { Metadata } from "next";
import { CheckCircle2, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "মন্দির যোগ করার নিয়মাবলী - আমার মন্দির | Guidelines",
  description:
    "আমার মন্দির প্ল্যাটফর্মে নতুন মন্দির যোগ করা এবং সম্পাদনা করার ক্ষেত্রে কিছু গুরুত্বপূর্ণ নিয়ম ও নির্দেশিকা।",
  keywords: [
    "নিয়মাবলী",
    "guidelines",
    "how to add temple",
    "আমার মন্দির রুলস",
  ],
};

export default function GuidelinesPage() {
  return (
    <>
      <main className="flex-1 bg-gray-50/30">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 bengali-title">
              নির্দেশিকা ও নিয়মাবলী
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
              প্ল্যাটফর্মের মান বজায় রাখতে তথ্য যুক্ত করার পূর্বে অনুগ্রহ করে
              নিচের নিয়মগুলো সতর্কতার সাথে পড়ে নিন।
            </p>
          </div>

          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold bengali-title">
                  সঠিক তথ্য প্রদান (Accuracy)
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-3 text-gray-700 bengali-text">
                <li>
                  মন্দিরের <strong>নাম এবং বর্ণনা</strong> অবশ্যই বাংলায় লিখতে
                  হবে। বানান ভুল এড়াতে জমা দেওয়ার আগে রিচেক করে নিন।
                </li>
                <li>
                  মন্দিরটি যে জেলায় এবং উপজেলায় অবস্থিত, ড্রপডাউন থেকে ঠিক সেটিই
                  নির্বাচন করুন।
                </li>
                <li>
                  বর্ণনায় মন্দিরের ইতিহাস, প্রতিষ্ঠাকাল, এবং প্রধান উৎসব
                  সম্পর্কে বিস্তারিত লিখলে তা অধিক গ্রহণযোগ্য হবে।
                </li>
                <li>
                  কোনো রকম অসম্পূর্ণ বা অস্পষ্ট তথ্য দেওয়া থেকে বিরত থাকুন।
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold bengali-title">
                  সঠিক লোকেশন (Google Maps)
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-3 text-gray-700 bengali-text">
                <li>মন্দিরের সঠিক লোকেশন গুগল ম্যাপস থেকে কালেকশন করতে হবে।</li>
                <li>
                  গুগল ম্যাপসের লিংকটি সরাসরি এড্রেস বার থেকে কপি করে পেস্ট
                  করুন। লিংকটি যেন কাজ করে তা চেক করে নিন।
                </li>
                <li>
                  ভুল লোকেশন দেওয়া থাকলে মডারেটর সেটি বাতিল (Reject) করতে পারেন।
                  যাতায়াতের উপায় অংশে বাস বা ট্রেনের রুট বিস্তারিত উল্লেখ করুন।
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold bengali-title">
                  ছবি আপলোড সংক্রান্ত (Photos)
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-3 text-gray-700 bengali-text">
                <li>
                  মন্দিরের ছবিগুলো অবশ্যই{" "}
                  <strong>উচ্চ মানের (High Resolution)</strong> এবং পরিষ্কার হতে
                  হবে। অন্ধকার বা অস্পষ্ট ছবি গ্রহণযোগ্য নয়।
                </li>
                <li>
                  কভার ছবি হিসেবে এমন ছবি দিন যাতে মন্দিরের পুরো কাঠামো বা
                  প্রধান ফটক ভালোভাবে বোঝা যায়।
                </li>
                <li>
                  ব্যক্তিগত ছবি, সেলফি বা মানুষের ভিড় আছে এমন ছবির চেয়ে মন্দিরের
                  স্থাপত্য, প্রতিমা এবং পরিবেশের ছবিকে প্রাধান্য দিন।
                </li>
                <li>
                  অন্যের তোলা ছবি বিনা অনুমতিতে আপলোড করবেন না (কপিরাইট ইস্যু)।
                  নিজে তুলে আপলোড করার চেষ্টা করুন।
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="bg-orange-50 rounded-2xl p-6 md:p-8 border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold bengali-title text-orange-900">
                  মডারেশন প্রসেস এবং পয়েন্ট
                </h2>
              </div>
              <div className="space-y-4 text-orange-800 bengali-text">
                <p>
                  আপনার দেওয়া প্রতিটি তথ্য (নতুন মন্দির, এডিট সাজেশন, ছবি আপলোড)
                  সরাসরি ওয়েবসাইটে প্রকাশ হওয়ার আগে আমাদের মডারেটর প্যানেল
                  দ্বারা পর্যালোচনা (Review) করা হয়।
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    তথ্য সঠিক হলে সেটি <strong>Approve</strong> করা হবে এবং আপনি
                    নির্দিষ্ট পয়েন্ট পাবেন।
                  </li>
                  <li>
                    ভুল তথ্য, অস্পষ্ট ছবি বা স্প্যাম মনে হলে তা{" "}
                    <strong>Reject</strong> করা হবে। রিজেক্ট হলে পেনাল্টি হিসেবে
                    পয়েন্ট কাটা যেতে পারে।
                  </li>
                  <li>
                    পয়েন্টের মাধ্যমে লিডারবোর্ডে আপনার অবস্থান নির্ধারিত হয়।
                    সঠিক তথ্য দিয়ে কমিউনিটিকে সাহায্য করে পয়েন্ট অর্জন করুন।
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
