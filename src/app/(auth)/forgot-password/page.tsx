"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { MapPin, ArrowLeft, Mail } from "lucide-react";

import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;

      setSubmitted(true);
      toast.success("রিসেট লিঙ্ক পাঠানো হয়েছে", {
        description: "আপনার ইমেইল চেক করুন।",
      });
    } catch (error: any) {
      toast.error("ব্যর্থ হয়েছে", {
        description: error.message || "আবার চেষ্টা করুন।",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfaf7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/">
            <Image
              src="https://res.cloudinary.com/dhavfhslp/image/upload/v1776825082/horizontal_logo_ysoot5.png"
              alt="Amar Mondir"
              width={240}
              height={42}
              className="h-10 w-auto mb-2"
              priority
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 -ml-2"
              >
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-2xl font-bold">
                পাসওয়ার্ড রিসেট
              </CardTitle>
            </div>
            <CardDescription>
              {submitted
                ? "আমরা আপনার ইমেইলে একটি রিসেট লিঙ্ক পাঠিয়েছি।"
                : "আপনার ইমেইল দিন, আমরা একটি রিসেট লিঙ্ক পাঠিয়ে দেব।"}
            </CardDescription>
          </CardHeader>

          {!submitted ? (
            <form onSubmit={handleReset}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? "প্রসেসিং..." : "রিসেট লিঙ্ক পাঠান"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="pt-4 pb-8 text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto">
                <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">ইমেইল চেক করুন</p>
                <p className="text-sm text-gray-500 bengali-text">
                  আমরা <b>{email}</b> ঠিকানায় পাসওয়ার্ড পরিবর্তনের নির্দেশনা
                  পাঠিয়েছি। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।
                </p>
              </div>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/login">লগ ইন পেজে ফিরে যান</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
