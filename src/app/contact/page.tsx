import { Metadata } from 'next';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'যোগাযোগ করুন - আমার মন্দির | Contact Amar Mondir',
  description: 'আমার মন্দির টিমের সাথে যোগাযোগ করুন। যেকোনো পরামর্শ, অভিযোগ বা মন্দির যোগ করার ক্ষেত্রে সাহায্যের জন্য আমাদের সাথে যোগাযোগ করতে পারেন।',
  keywords: ['যোগাযোগ', 'আমার মন্দির যোগাযোগ', 'contact amar mondir', 'support'],
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 bengali-title">
          যোগাযোগ করুন
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
          আপনার যেকোনো জিজ্ঞাসা, পরামর্শ বা সহায়তার জন্য আমাদের সাথে নির্দ্বিধায় যোগাযোগ করতে পারেন। আমরা দ্রুত আপনার মেইলের উত্তর দেওয়ার চেষ্টা করবো।
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-orange-100 text-orange-600 p-3 rounded-full flex-shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">ইমেইল করুন</h3>
              <p className="text-gray-600 mb-3 bengali-text">
                সাধারণ জিজ্ঞাসা, টেকনিক্যাল সাপোর্ট অথবা যেকোনো অফিশিয়াল কারণে আমাদের ইমেইল করতে পারেন।
              </p>
              <a href="mailto:joymkrishna@gmail.com" className="text-orange-600 font-medium hover:underline">
                joymkrishna@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full flex-shrink-0">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">ফেসবুক গ্রুপ</h3>
              <p className="text-gray-600 mb-3 bengali-text">
                আমাদের ফেসবুক কমিউনিটিতে যুক্ত হোন। এখানে অন্যান্য সদস্যদের সাথে আলোচনা করতে এবং আপডেট পেতে পারেন।
              </p>
              <a href="https://www.facebook.com/groups/sonatoni.bondhuder.addakhana" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                সনাতনী বন্ধুদের আড্ডাখানা ↗
              </a>
            </div>
          </div>
        </div>

        {/* Message Form / Info Box */}
        <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-title">কীভাবে সাহায্য করতে পারি?</h2>
          <div className="space-y-4 text-gray-700 bengali-text">
            <p>
              বর্তমানে আমাদের ওয়েবসাইটে কোনো ডিরেক্ট মেসেজ ফর্ম নেই। দয়া করে আপনার যেকোনো বিষয়ে আমাদের ইমেইল করুন। 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>কোনো মন্দিরের তথ্যে ভুল থাকলে।</li>
              <li>নতুন ছবি বা তথ্য যুক্ত করার ক্ষেত্রে টেকনিক্যাল সমস্যা হলে।</li>
              <li>আপনার প্রোফাইল নাম বা ইমেইল পরিবর্তন করতে চাইলে।</li>
              <li>কোনো বাগ বা এরর রিপোর্ট করতে চাইলে।</li>
            </ul>
            <div className="pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                <a href="mailto:joymkrishna@gmail.com">ইমেইল খুলুন</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
