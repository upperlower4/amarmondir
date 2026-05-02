import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'গোপনীয়তা নীতি (Privacy Policy) - আমার মন্দির',
  description: 'আমার মন্দির কীভাবে ব্যবহারকারীদের ডেটা সংগ্রহ, ব্যবহার ও নিরাপদ রাখে তার বিস্তারিত গোপনীয়তা নীতি।',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 bengali-title">
          গোপনীয়তা নীতি (Privacy Policy)
        </h1>
        <p className="text-gray-500">সর্বশেষ আপডেট: ০৩ মে, ২০২৬</p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-100 space-y-8 text-gray-700 bengali-text text-lg leading-relaxed">
        
        <section>
          <p>
            <strong>‘আমার মন্দির’</strong> (Amar Mondir)-এ আপনাকে স্বাগতম। এই প্ল্যাটফর্মটি ব্যবহার করার সময় আমরা আপনার গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দিয়ে থাকি। আমরা কীভাবে আপনার তথ্যাদি সংগ্রহ ও ব্যবহার করি, তা এই পলিসিতে বিস্তারিত জানানো হলো।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">১. আমরা কী ধরনের তথ্য সংগ্রহ করি?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>অ্যাকাউন্ট তথ্য:</strong> আপনি যখন Google বা অন্য কোনো মাধ্যমে লগইন করেন, তখন আমরা আপনার নাম, ইমেইল ঠিকানা এবং প্রোফাইল পিকচার সংগ্রহ করি।</li>
            <li><strong>আপনার প্রদত্ত কনটেন্ট:</strong> আপনার যোগ করা মন্দিরের তথ্য, ছবি, রিভিউ এবং আপনি যেসব এডিট সাজেশন দেন।</li>
            <li><strong>টেকনিক্যাল তথ্য:</strong> ওয়েবসাইট ভিজিট করার সময় কুকিজ, আইপি এড্রেস এবং ব্রাউজার সম্পর্কিত বেসিক তথ্য।</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">২. তথ্য ব্যবহারের উদ্দেশ্য</h2>
          <p>সংগৃহীত তথ্য আমরা নিচের উদ্দেশ্যগুলোতে ব্যবহার করে থাকি:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>আপনাকে প্ল্যাটফর্মে লগইন করতে এবং কন্ট্রিবিউট করার সুবিধা দিতে।</li>
            <li>আপনার যোগ করা মন্দিরের তথ্যে আপনার প্রোফাইলের নাম (কন্ট্রিবিউটর হিসেবে) প্রদর্শন করতে।</li>
            <li>পয়েন্ট হিসাব করতে এবং <strong>লিডারবোর্ড</strong> তৈরি করতে যেখানে সর্বোচ্চ অবদানকারীদের নাম দেখানো হয়।</li>
            <li>স্প্যামিং রোধ করতে এবং মডারেশন প্রসেস সুষ্ঠুভাবে পরিচালনা করতে।</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">৩. তৃতীয় পক্ষের সাথে তথ্য শেয়ারিং</h2>
          <p>
            আপনার ব্যক্তিগত তথ্য (যেমন ইমেইল এড্রেস) আমরা অন্য কোনো থার্ড-পাটি বা কোম্পানির কাছে বিক্রি বা ভাড়া দিই না। তবে আমরা আমাদের সার্ভার এবং ডাটাবেস পরিচালনার জন্য <strong>Supabase</strong> এবং <strong>Google Firebase</strong> ব্যবহার করি, যারা ইন্টারন্যাশনাল ডাটা সিকিউরিটি মান মেনে চলে।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">৪. ডেটা সুরক্ষা</h2>
          <p>
            আপনার অ্যাকাউন্ট নিরাপদ রাখতে আমরা ইন্ডাস্ট্রি-স্ট্যান্ডার্ড সিকিউরিটি প্রোটোকল ব্যবহার করি। যেহেতু আপনার লগইন সরাসরি Google-এর মাধ্যমে হয়, তাই আপনার পাসওয়ার্ড আমাদের ডাটাবেসে সংরক্ষিত থাকে না।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">৫. কুকিজ (Cookies)</h2>
          <p>
            আপনাকে লগ-ইন অবস্থায় রাখতে এবং ওয়েবসাইটের পারফরম্যান্স ট্র‍্যাক করতে আমরা কিছু কুকি ব্যবহার করে থাকি। আপনি চাইলে ব্রাউজারের সেটিংস থেকে কুকি ব্লক করতে পারেন, তবে এতে ওয়েবসাইটের কিছু ফিচার কাজ নাও করতে পারে।
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title mt-8">৬. নীতিমালায় পরিবর্তন</h2>
          <p>
            প্রয়োজনবোধে আমরা এই গোপনীয়তা নীতি যেকোনো সময় পরিবর্তন বা পরিমার্জন করার অধিকার সংরক্ষণ করি। বড় কোনো পরিবর্তন হলে ওয়েবসাইটে তা নোটিশের মাধ্যমে জানানো হবে।
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-xl mt-8">
          <p>
            গোপনীয়তা নীতি সম্পর্কে আপনার কোনো প্রশ্ন বা উদ্বেগ থাকলে আমাদের সাঙ্গে যোগাযোগ করুন: <strong><a href="mailto:joymkrishna@gmail.com" className="text-orange-600 hover:underline">joymkrishna@gmail.com</a></strong>
          </p>
        </section>

      </div>
    </div>
  );
}
