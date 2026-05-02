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

      toast.success("রেজিস্ট্রেশন সফল হয়েছে!");

      // If we have a session, we are logged in. If not, we might need confirmation.
      // But the user wants direct access.
      if (data.session) {
        window.location.href = `/profile/${cleanUsername}`;
      } else {
        // If confirmation is required, we still redirect to profile,
        // but they might not be "logged in" state until they confirm.
        // For now, let's try to go to profile.
        router.push(`/profile/${cleanUsername}`);
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
              অ্যাকাউন্ট খুলুন
            </CardTitle>
            <CardDescription>
              আপনার সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন
            </CardDescription>
          </CardHeader>
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
        </Card>
      </div>
    </div>
  );
}
