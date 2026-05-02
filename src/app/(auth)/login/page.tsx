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

import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfigured) {
      toast.error("সিস্টেম এরর", {
        description: "ডাটাবেস সঠিকভাবে কনফিগার করা হয়নি।",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("সফলভাবে লগ ইন করেছেন");
      window.location.href = "/";
    } catch (error: any) {
      let errorMsg = String(error?.message || error);

      if (errorMsg === "Invalid login credentials") {
        errorMsg = "ইমেইল বা পাসওয়ার্ড ভুল";
      }

      toast.error("লগ ইন ব্যর্থ হয়েছে", {
        description: errorMsg,
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
            Welcome to Temple Directory
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">লগ ইন</CardTitle>
            <CardDescription>আপনার অ্যাকাউন্টে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-orange-600 hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
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
                {loading ? "প্রসেসিং..." : "লগ ইন করুন"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                অ্যাকাউন্ট নেই?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-orange-600 hover:underline"
                >
                  সাইন আপ করুন
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
