'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AddTempleWizard } from '@/components/forms/AddTempleWizard';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AddTemplePage() {
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-bold font-serif">প্রবেশ করুন</h1>
              <p className="text-gray-500 bengali-text">
                মন্দির যোগ করার জন্য আপনাকে লগ ইন করতে হবে। আমাদের কমিউনিটিতে অবদান রাখতে জয়েন করুন।
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="bg-orange-500" asChild>
                  <Link href="/login">লগ ইন করুন</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">রেজিস্ট্রেশন</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#fcfaf7] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-10">
            <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4">নতুন মন্দির যুক্ত করুন</h1>
            <p className="text-gray-500 bengali-text">সঠিক তথ্য দিয়ে মন্দির ডিরেক্টরি সমৃদ্ধ করতে সহায়তা করুন। আপনার দেওয়া তথ্য আমাদের টিম যাচাই করে এপ্রুভ করবে।</p>
          </div>
          
          <AddTempleWizard userId={user.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
