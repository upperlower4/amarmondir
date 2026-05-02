import { Metadata } from 'next';
import { BookOpen, Heart, History, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে - আমার মন্দির | About Amar Mondir',
  description: '\'আমার মন্দির\' হলো বাংলাদেশের সনাতনী মন্দিরগুলোর একটি ডিজিটাল আর্কাইভ। জানুন আমাদের লক্ষ্য এবং কেন আমরা এই উদ্যোগ শুরু করেছি।',
  keywords: ['আমার মন্দির', 'বাংলাদেশের মন্দির', 'সনাতন ধর্ম', 'about amar mondir', 'hindu temples bangladesh'],
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 bengali-title">
          আমাদের সম্পর্কে
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
          বাংলাদেশের কোণায় কোণায় ছড়িয়ে থাকা সনাতন ধর্মের প্রাচীন ও ঐতিহাসিক স্মৃতিচিহ্নগুলো সংরক্ষণের একটি ডিজিটাল উদ্যোগ।
        </p>
      </div>

      <div className="space-y-16">
        {/* Section 1: Introduction */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 sm:p-12 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 bengali-title">কেন এই ‘আমার মন্দির’?</h2>
          <div className="text-gray-700 leading-relaxed space-y-4 text-lg bengali-text">
            <p>
              বাংলাদেশ নদীমাতৃক এক বৈচিত্র্যময় দেশ। যুগের পর যুগ ধরে এই বদ্বীপে গড়ে উঠেছে সনাতন ধর্মের অগণিত মন্দির, তীর্থস্থান ও আশ্রম। কিন্তু পরিতাপের বিষয় হলো, ইন্টারনেটের এই যুগেও আমাদের অনেক ঐতিহাসিক ও জাগ্রত মন্দিরের কোনো সঠিক তথ্য অনলাইনে পাওয়া যায় না।
            </p>
            <p>
              অনেক পুরনো মন্দির কালের গহ্বরে হারিয়ে যাচ্ছে, আবার অনেক স্থানে যাওয়ার সঠিক রাস্তা না জানায় দর্শনার্থীরা যেতে পারছেন না। এই অভাববোধ থেকেই <strong>‘আমার মন্দির’</strong>-এর জন্ম।
            </p>
          </div>
        </section>

        {/* Section 2: Goals */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center bengali-title">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-orange-50/50 p-8 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-title">ডিজিটাল আর্কাইভ তৈরি</h3>
              <p className="text-gray-600 leading-relaxed bengali-text">
                বাংলাদেশের প্রতিটি সনাতনী মন্দিরের একটি পূর্ণাঙ্গ ডিজিটাল ডিরেক্টরি বা ডেটাবেস তৈরি করা, যাতে যে কেউ সহজেই যেকোনো মন্দিরের তথ্য পেতে পারে।
              </p>
            </div>
            
            <div className="bg-orange-50/50 p-8 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-title">ইতিহাস ও ঐতিহ্য সংরক্ষণ</h3>
              <p className="text-gray-600 leading-relaxed bengali-text">
                প্রাচীন মন্দিরগুলোর সঠিক ইতিহাস, স্থপতি, এবং পূজার ধরণ লিপিবদ্ধ করা। এগুলো শুধু ইট-পাথরের দালান নয়, আমাদের পূর্বপুরুষদের সমৃদ্ধ সংস্কৃতির সাক্ষী।
              </p>
            </div>

            <div className="bg-orange-50/50 p-8 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-title">সনাতনী কমিউনিটি সংযুক্তকরণ</h3>
              <p className="text-gray-600 leading-relaxed bengali-text">
                দেশের বিভিন্ন প্রান্তের সনাতনীদের একই প্ল্যাটফর্মে নিয়ে আসা। ব্যবহারকারীরা নিজের এলাকার মন্দির যুক্ত করে অন্যদের সাহায্য করতে পারবেন।
              </p>
            </div>

            <div className="bg-orange-50/50 p-8 rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-title">তীর্থযাত্রায় সহায়তা</h3>
              <p className="text-gray-600 leading-relaxed bengali-text">
                মন্দিরের সঠিক লোকেশন (Google Maps), যাতায়াত ব্যবস্থা, এবং দর্শনের সময়সূচি প্রদানের মাধ্যমে পুণ্যার্থীদের যাত্রাকে সহজ ও নির্বিঘ্ন করা।
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Call to Action */}
        <section className="bg-gray-900 text-white rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 bengali-title">আমাদের সাথে যুক্ত হোন</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg bengali-text">
            এই বিশাল কর্মযজ্ঞ একা কারো পক্ষে সম্পন্ন করা সম্ভব নয়। আমরা চাই আপনারা সবাই এর অংশ হোন। আপনার বাড়ির পাশের ছোট মন্দিরটির তথ্য আজই যোগ করে অবদান রাখুন এই ডিজিটালাইজেশনে।
          </p>
        </section>
      </div>
    </div>
  );
}
