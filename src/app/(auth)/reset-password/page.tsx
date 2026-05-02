"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { MapPin, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("পাসওয়ার্ড মেলেনি");
      return;
    }

    if (password.length < 6) {
      toast.error("পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      toast.success("পাসওয়ার্ড সফলভাবে আপডেট হয়েছে");

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      toast.error("আপডেট ব্যর্থ হয়েছে", {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-200">
              <MapPin className="h-8 w-8" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight font-serif">
            amarmondir
          </h1>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">নতুন পাসওয়ার্ড</CardTitle>
            <CardDescription>
              {success
                ? "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।"
                : "আপনার নতুন পাসওয়ার্ড সেট করুন।"}
            </CardDescription>
          </CardHeader>

          {!success ? (
            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">
                    পাসওয়ার্ড নিশ্চিত করুন
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? "আপডেট হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="pt-4 pb-8 text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 text-lg">
                  সফলভাবে সম্পন্ন!
                </p>
                <p className="text-sm text-gray-500 bengali-text">
                  আপনার পাসওয়ার্ড পরিবর্তিত হয়েছে। আপনাকে ৩ সেকেন্ডের মধ্যে লগ
                  ইন পেজে নিয়ে যাওয়া হবে।
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                <Link href="/login">লগ ইন করুন</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
