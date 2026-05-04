"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { supabase, isConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { sanitizeUsername } from "@/lib/utils";

import Image from "next/image";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfigured) {
      toast.error("সিস্টেম এরর", {
        description:
          "Supabase ডাটাবেস ঠিকভাবে কনফিগার করা হয়নি। দয়া করে সেটিংস চেক করুন।",
      });
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = sanitizeUsername(username);
      if (!cleanUsername || cleanUsername.length < 3) {
        toast.error("ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে");
        return;
      }

      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existingUser) {
        toast.error("এই ইউজারনেমটি আগেই নেওয়া হয়েছে");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success("রেজিস্ট্রেশন সফল হয়েছে!");
        window.location.href = `/profile/${cleanUsername}`;
      } else {
        toast.success("আপনার ইমেইলে একটি ৬-সংখ্যার OTP পাঠানো হয়েছে");
        setIsOtpSent(true);
      }
    } catch (error: any) {
      let errorMsg = String(error?.message || error);

      if (errorMsg.includes("User already registered")) {
        errorMsg = "এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট খোলা হয়েছে।";
      }

      toast.error("রেজিস্ট্রেশন ব্যর্থ হয়েছে", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "signup",
      });

      if (error) throw error;

      toast.success("অ্যাকাউন্ট ভেরিফিকেশন সফল হয়েছে!");
      window.location.href = `/profile/${sanitizeUsername(username)}`;
    } catch (err: any) {
      toast.error("OTP ভেরিফিকেশন ব্যর্থ হয়েছে", {
        description: err?.message || String(err),
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
          <p className="text-muted-foreground bengali-text">
            নতুন কমিউনিটি মেম্বার হিসেবে জয়েন করুন
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isOtpSent ? "OTP ভেরিফাই করুন" : "অ্যাকাউন্ট খুলুন"}
            </CardTitle>
            <CardDescription>
              {isOtpSent
                ? "আপনার ইমেইলে পাঠানো ৬-সংখ্যার কোডটি দিন"
                : "আপনার সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন"}
            </CardDescription>
          </CardHeader>
          {isOtpSent ? (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP কোড</Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    কোডটি {email} এ পাঠানো হয়েছে। ইনবক্সে না পেলে স্প্যাম
                    ফোল্ডার চেক করুন।
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "প্রসেসিং..." : "ভেরিফাই করুন"}
                </Button>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    পিছনে যান এবং আবার চেষ্টা করুন
                  </button>
                </div>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">সম্পূর্ণ নাম</Label>
                  <Input
                    id="fullName"
                    placeholder="আপনার নাম"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">ইউজারনেম</Label>
                  <Input
                    id="username"
                    placeholder="your_username"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    a-z, 0-9 এবং underscore ব্যবহার করুন
                  </p>
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? "প্রসেসিং..." : "রেজিস্ট্রেশন করুন"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    লগ ইন করুন
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
