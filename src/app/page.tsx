import Image from "next/image";
import Link from "next/link";
import { TempleCard } from "@/components/TempleCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, isConfigured } from "@/lib/supabase";
import { MapPin, Plus, Search, Users, BookOpen, Star } from "lucide-react";
import { DIVISIONS, TEMPLE_TYPES } from "@/lib/constants";
import type { Temple } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getHomeData() {
  if (!isConfigured) {
    return {
      featuredTemples: [],
      recentTemples: [],
      stats: { total: 0, divisions: 0, contributors: 0 },
    };
  }

  const [
    { data: featuredTemples },
    { data: recentTemples },
    { count: totalTemples },
    { count: totalContributors },
  ] = await Promise.all([
    supabase
      .from("temples")
      .select("*")
      .eq("status", "approved")
      .not("slug", "is", null)
      .eq("is_featured", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("temples")
      .select("*")
      .eq("status", "approved")
      .not("slug", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("temples")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .is("deleted_at", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return {
    featuredTemples: (featuredTemples || []) as Temple[],
    recentTemples: (recentTemples || []) as Temple[],
    stats: {
      total: totalTemples || 0,
      divisions: 8,
      contributors: totalContributors || 0,
    },
  };
}

export default async function HomePage() {
  const { featuredTemples, recentTemples, stats } = await getHomeData();

  const displayTemples =
    featuredTemples.length > 0 ? featuredTemples : recentTemples.slice(0, 4);

  return (
    <>
      <main className="flex-1 bg-[#fcfaf7]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-[#fcfaf7] to-amber-50 border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6 border border-orange-200">
                <Star className="h-4 w-4" />
                <span>বাংলাদেশের মন্দির ডিরেক্টরি</span>
              </div>
              <div className="flex justify-center mb-6">
                <Image
                  src="https://res.cloudinary.com/dhavfhslp/image/upload/v1776825110/Logo_pmyblv.png"
                  alt="Amar Mondir Logo"
                  width={128}
                  height={128}
                  className="h-24 w-auto md:h-32"
                  priority
                />
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 font-serif leading-[1.1]">
                এবার বিশ্ব দেখবে <br />
                <span className="text-orange-500">আমার মন্দির</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 bengali-text mb-8 leading-relaxed max-w-2xl mx-auto">
                বাংলাদেশের সকল হিন্দু মন্দির ও তীর্থস্থানের সমৃদ্ধ ডিরেক্টরি।
                আপনার এলাকার মন্দির খুঁজুন এবং তথ্য যোগ করে সংরক্ষণে অবদান
                রাখুন।
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2 px-8"
                >
                  <Link href="/directory">
                    <Search className="h-5 w-5" />
                    মন্দির খুঁজুন
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 border-orange-200 hover:bg-orange-50 px-8"
                >
                  <Link href="/add-temple">
                    <Plus className="h-5 w-5" />
                    মন্দির যোগ করুন
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-white">
          <div className="container mx-auto px-4 py-10">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
              <div className="p-4">
                <p className="text-3xl md:text-4xl font-bold font-serif text-orange-600">
                  {stats.total}+
                </p>
                <p className="text-sm text-gray-500 mt-1 bengali-text">
                  নিবন্ধিত মন্দির
                </p>
              </div>
              <div className="p-4 border-x">
                <p className="text-3xl md:text-4xl font-bold font-serif text-orange-600">
                  {stats.divisions}
                </p>
                <p className="text-sm text-gray-500 mt-1 bengali-text">
                  বিভাগ জুড়ে
                </p>
              </div>
              <div className="p-4">
                <p className="text-3xl md:text-4xl font-bold font-serif text-orange-600">
                  {stats.contributors}+
                </p>
                <p className="text-sm text-gray-500 mt-1 bengali-text">
                  অবদানকারী
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured / Recent Temples */}
        {displayTemples.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-900">
                    {featuredTemples.length > 0
                      ? "বিশেষ মন্দির"
                      : "সাম্প্রতিক মন্দির"}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 bengali-text">
                    {featuredTemples.length > 0
                      ? "সম্পাদক বাছাইকৃত উল্লেখযোগ্য মন্দির"
                      : "সম্প্রতি যোগ করা মন্দিরসমূহ"}
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Link href="/directory">সব দেখুন →</Link>
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayTemples.map((temple) => (
                  <TempleCard key={temple.id} temple={temple} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Browse by Division */}
        <section className="py-12 md:py-16 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-900 mb-2">
                বিভাগ অনুযায়ী খুঁজুন
              </h2>
              <p className="text-gray-500 bengali-text text-sm">
                আপনার বিভাগ বেছে নিন
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {DIVISIONS.map((division) => (
                <Link
                  key={division}
                  href={`/division/${encodeURIComponent(division)}`}
                  className="flex items-center gap-2 p-3 rounded-xl border bg-[#fcfaf7] hover:bg-orange-50 hover:border-orange-200 transition-colors group"
                >
                  <MapPin className="h-4 w-4 text-orange-400 group-hover:text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 truncate">
                    {division}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Type */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-gray-900 mb-2">
                ধরন অনুযায়ী খুঁজুন
              </h2>
              <p className="text-gray-500 bengali-text text-sm">
                মন্দিরের ধরন বেছে নিন
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
              {TEMPLE_TYPES.map((type) => (
                <Link key={type} href={`/type/${encodeURIComponent(type)}`}>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                  >
                    {type}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-orange-500 to-amber-500 text-white">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">
              আপনার এলাকার মন্দির যোগ করুন
            </h2>
            <p className="text-orange-100 bengali-text mb-8 leading-relaxed">
              আমাদের ঐতিহ্য ও সংস্কৃতিকে সংরক্ষণ করতে সাহায্য করুন। নতুন মন্দির
              যোগ করে অথবা তথ্য সংশোধন করে অবদান রাখুন।
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 gap-2 font-bold"
              >
                <Link href="/add-temple">
                  <Plus className="h-5 w-5" />
                  মন্দির যোগ করুন
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white gap-2"
              >
                <Link href="/leaderboard">
                  <Users className="h-5 w-5" />
                  অবদানকারী তালিকা
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
