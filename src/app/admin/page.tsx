"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
  FilePenLine,
  Users,
  Building,
  Activity,
  Search,
  Image as ImageIcon,
  Flag,
  Trash2,
  ArrowRight,
  BellRing,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { safeJsonStringify } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [pendingTemples, setPendingTemples] = useState<any[]>([]);
  const [allTemples, setAllTemples] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);

  const [stats, setStats] = useState({
    pendingEditCount: 0,
    totalTemples: 0,
    totalUsers: 0,
    approvedTemples: 0,
  });

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);

    try {
      const [
        pendingRes,
        editsDataRes,
        totalTemplesRes,
        totalUsersRes,
        approvedTemplesRes,
        allTemplesDataRes,
        usersDataRes,
      ] = await Promise.all([
        supabase
          .from("temples")
          .select(
            "*, profiles!temples_created_by_fkey(username, full_name, avatar_url)",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        supabase
          .from("temple_edits")
          .select(
            "*, temples(title, slug), profiles!temple_edits_profile_id_fkey(username, avatar_url)",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        supabase
          .from("temples")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("temples")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .is("deleted_at", null),
        supabase
          .from("temples")
          .select(
            "id, slug, title, status, created_at, upazila, district, deleted_at, profiles!temples_created_by_fkey(username)",
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("profiles")
          .select("id, username, full_name, is_admin, created_at, avatar_url")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (pendingRes.error) throw pendingRes.error;

      setPendingTemples(pendingRes.data || []);
      setPendingEdits(editsDataRes.data || []);
      setAllTemples(allTemplesDataRes.data || []);
      setAllUsers(usersDataRes.data || []);

      setStats({
        pendingEditCount: editsDataRes.data?.length || 0,
        totalTemples: totalTemplesRes.count || 0,
        totalUsers: totalUsersRes.count || 0,
        approvedTemples: approvedTemplesRes.count || 0,
      });
    } catch (error: any) {
      console.error("Fetch admin data error:", error);
      toast.error("অ্যাডমিন ডাটা লোড করা যায়নি", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.is_admin) {
      const fetch = async () => {
        await fetchAdminData();
      };
      fetch();
    } else if (profile && !profile.is_admin) {
      setTimeout(() => setLoading(false), 0);
    } else if (!authLoading) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [profile, authLoading]);

  const handleModerateTemple = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    console.log(
      `[handleModerateTemple] starting for id: ${id}, status: ${status}`,
    );
    setProcessingId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(
          "আপনার লগইন সেশন এক্সপায়ার হয়েছে। দয়া করে আবার লগইন করুন।",
        );
      }

      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          entity: "temple",
          action: status === "approved" ? "approve" : "reject",
          id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP error: ${res.status}`);

      toast.success(
        status === "approved"
          ? "মন্দির এপ্রুভ করা হয়েছে"
          : "মন্দির রিজেক্ট করা হয়েছে",
      );

      setPendingTemples((prev) => prev.filter((t) => t.id !== id));
      setAllTemples((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );

      if (status === "approved") {
        setStats((s) => ({ ...s, approvedTemples: s.approvedTemples + 1 }));
      }
    } catch (error: any) {
      console.error("[handleModerateTemple] error:", error);
      toast.error("অপারেশন ব্যর্থ হয়েছে: " + (error.message || ""));
    } finally {
      setProcessingId(null);
    }
  };

  const handleTempleAction = async (
    id: string,
    action: "soft_delete" | "restore",
  ) => {
    setProcessingId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(
          "আপনার লগইন সেশন এক্সপায়ার হয়েছে। দয়া করে আবার লগইন করুন।",
        );
      }

      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ entity: "temple", action: action, id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP error: ${res.status}`);

      toast.success(
        action === "soft_delete"
          ? "মন্দির মুছে ফেলা হয়েছে"
          : "মন্দির রিস্টোর করা হয়েছে",
      );

      setAllTemples((prev) => {
        const temple = prev.find((t) => t.id === id);
        if (temple) {
          if (action === "soft_delete" && !temple.deleted_at) {
            setStats((s) => ({
              ...s,
              approvedTemples:
                temple.status === "approved"
                  ? Math.max(0, s.approvedTemples - 1)
                  : s.approvedTemples,
              totalTemples: Math.max(0, s.totalTemples - 1),
            }));
          } else if (action === "restore" && temple.deleted_at) {
            setStats((s) => ({
              ...s,
              approvedTemples:
                temple.status === "approved"
                  ? s.approvedTemples + 1
                  : s.approvedTemples,
              totalTemples: s.totalTemples + 1,
            }));
          }
        }
        return prev.map((t) =>
          t.id === id
            ? {
                ...t,
                deleted_at:
                  action === "soft_delete" ? new Date().toISOString() : null,
              }
            : t,
        );
      });
    } catch (error: any) {
      console.error("[handleTempleAction] error:", error);
      toast.error("অপারেশন ব্যর্থ হয়েছে: " + (error.message || ""));
    } finally {
      setProcessingId(null);
    }
  };

  const handleModerateEdit = async (
    editId: string,
    templeId: string,
    suggestedData: any,
    status: "approved" | "rejected",
  ) => {
    console.log(`[handleModerateEdit] starting for editId: ${editId}`);
    setProcessingId(`edit-${editId}`);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(
          "আপনার লগইন সেশন এক্সপায়ার হয়েছে। দয়া করে আবার লগইন করুন।",
        );
      }

      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          entity: "edit",
          action: status === "approved" ? "approve" : "reject",
          id: editId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP error: ${res.status}`);

      toast.success(
        status === "approved"
          ? "এডিট এপ্রুভ করা হয়েছে"
          : "এডিট রিজেক্ট করা হয়েছে",
      );
      setPendingEdits((prev) => prev.filter((e) => e.id !== editId));
      setStats((s) => ({ ...s, pendingEditCount: s.pendingEditCount - 1 }));
    } catch (error: any) {
      console.error("[handleModerateEdit] error:", error);
      toast.error("অপারেশন ব্যর্থ হয়েছে: " + (error.message || ""));
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold">এক্সেস নেই</h1>
          <p className="text-gray-500">
            এই পৃষ্ঠাটি শুধুমাত্র অ্যাডমিনদের জন্য।
          </p>
          <Button asChild className="bg-orange-500">
            <Link href="/">হোমপেজে ফিরে যান</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 bg-gray-50/50 py-6 md:py-12 min-h-[80vh]">
        <div className="container mx-auto px-4">
          <BackButton className="mb-6" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-3">
                <ShieldCheck className="h-3 w-3" />
                ADVANCED ADMIN STUDIO
              </div>
              <h1 className="text-3xl font-bold font-serif text-slate-900">
                ড্যাশবোর্ড
              </h1>
              <p className="text-gray-500 bengali-text mt-1">
                পুরো অ্যাপ্লিকেশনের সার্বিক অবস্থা ও মডারেশন
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Link href="/admin/notifications">
                  <BellRing className="h-4 w-4 mr-2" /> গ্লোবাল নোটিফিকেশন
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-white border p-1 rounded-xl h-auto w-full md:w-auto inline-flex overflow-x-auto justify-start">
              <TabsTrigger value="overview" className="rounded-lg px-4 py-2.5">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="rounded-lg px-4 py-2.5"
              >
                New Temples
                {pendingTemples.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
                    {pendingTemples.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="edits" className="rounded-lg px-4 py-2.5">
                Edit Requests
                {stats.pendingEditCount > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">
                    {stats.pendingEditCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="temples" className="rounded-lg px-4 py-2.5">
                All Temples
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg px-4 py-2.5">
                Users
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">মোট ইউজার</p>
                        <p className="text-3xl font-bold text-gray-900">{loading ? "-" : stats.totalUsers}</p>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">সার্বমোট মন্দির</p>
                        <p className="text-3xl font-bold text-gray-900">{loading ? "-" : stats.totalTemples}</p>
                      </div>
                      <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <Building className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">এপ্রুভড মন্দির</p>
                        <p className="text-3xl font-bold text-gray-900">{loading ? "-" : stats.approvedTemples}</p>
                      </div>
                      <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <Check className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">অপেক্ষমাণ কাজ</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {loading ? "-" : pendingTemples.length + stats.pendingEditCount}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Activity className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* NEW TEMPLES TAB */}
            <TabsContent value="moderation" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                </div>
              ) : pendingTemples.length === 0 ? (
                <div className="bg-white border rounded-3xl p-12 text-center shadow-sm">
                  <ShieldCheck className="h-16 w-16 text-green-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    বর্তমানে কোন নতুন সাবমিশন নেই।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {pendingTemples.map((temple) => (
                    <Card
                      key={temple.id}
                      className="overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:border-orange-200 transition-colors"
                    >
                      <div className="relative w-full h-48 sm:h-56 shrink-0 bg-gray-100 border-b">
                        <Image
                          src={
                            temple.cover_image ||
                            "https://picsum.photos/seed/temple/500/500"
                          }
                          alt={temple.title || "Temple"}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge variant="secondary" className="bg-white/90 text-slate-800 shadow-sm font-medium">
                            {temple.temple_type}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold mb-1 text-slate-900 leading-tight">
                            {temple.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {temple.upazila}, {temple.district},{" "}
                            {temple.division}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-50/50 border border-gray-100 p-4 rounded-xl mb-6 line-clamp-3 leading-relaxed flex-1">
                          {temple.short_bio || "কোনো বর্ণনা দেওয়া হয়নি"}
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-gray-200">
                              <AvatarImage src={temple.profiles?.avatar_url} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="text-xs">
                              <p className="text-gray-500">আপলোডার</p>
                              <p className="font-bold text-slate-700">@{temple.profiles?.username}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="h-9 font-medium">
                              <Link
                                href={`/temple/${temple.slug}`}
                                target="_blank"
                              >
                                বিস্তারিত
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-9 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none font-medium"
                              onClick={() =>
                                handleModerateTemple(temple.id, "rejected")
                              }
                              disabled={processingId === temple.id}
                            >
                              <X className="h-4 w-4 mr-1" /> রিজেক্ট
                            </Button>
                            <Button
                              size="sm"
                              className="h-9 bg-green-600 hover:bg-green-700 shadow-sm text-white font-medium"
                              onClick={() =>
                                handleModerateTemple(temple.id, "approved")
                              }
                              disabled={processingId === temple.id}
                            >
                              <Check className="h-4 w-4 mr-1" /> এপ্রুভ
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* EDIT REQUESTS TAB */}
            <TabsContent value="edits" className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                </div>
              ) : pendingEdits.length === 0 ? (
                <div className="bg-white border rounded-3xl p-12 text-center shadow-sm">
                  <FilePenLine className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    বর্তমানে কোন এডিট রিকোয়েস্ট নেই।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingEdits.map((edit) => (
                    <Card key={edit.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-gray-200">
                              <AvatarImage src={edit.profiles?.avatar_url} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p className="font-bold text-slate-800">
                                @{edit.profiles?.username}
                              </p>
                              <p className="text-gray-500 text-xs">সাজেশন দিয়েছেন</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none">এডিট রিকোয়েস্ট</Badge>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">মন্দির:</p>
                          <Link
                            href={`/temple/${edit.temple?.slug}`}
                            target="_blank"
                            className="text-lg font-bold text-orange-600 hover:underline flex items-center gap-1 w-fit"
                          >
                            {edit.temple?.title} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 font-mono text-xs overflow-x-auto flex-1">
                          <p className="text-slate-500 font-sans font-bold mb-2 uppercase text-[10px] tracking-wider">পরিবর্তনসমূহ</p>
                          <pre className="text-slate-700">
                            {JSON.stringify(edit.suggested_data, null, 2)}
                          </pre>
                        </div>

                        <div className="flex justify-end gap-3 mt-auto border-t pt-4">
                          <Button
                            variant="destructive"
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none font-medium"
                            onClick={() =>
                              handleModerateEdit(
                                edit.id,
                                edit.temple_id,
                                edit.suggested_data,
                                "rejected",
                              )
                            }
                            disabled={processingId === `edit-${edit.id}`}
                          >
                            <X className="h-4 w-4 mr-1" /> রিজেক্ট
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700 shadow-sm text-white font-medium"
                            onClick={() =>
                              handleModerateEdit(
                                edit.id,
                                edit.temple_id,
                                edit.suggested_data,
                                "approved",
                              )
                            }
                            disabled={processingId === `edit-${edit.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" /> এপ্রুভ করুন
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ALL TEMPLES TAB */}
            <TabsContent value="temples" className="space-y-6">
              <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden">
                <div className="p-5 border-b bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-orange-500" /> সব মন্দির
                  </h3>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="মন্দির খুঁজুন..."
                      className="pl-9 bg-gray-50/50 border-gray-200 focus-visible:ring-orange-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4 tracking-wider">নাম</th>
                        <th className="px-6 py-4 tracking-wider">আপলোডার</th>
                        <th className="px-6 py-4 tracking-wider">স্ট্যাটাস</th>
                        <th className="px-6 py-4 tracking-wider text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allTemples
                        .filter((t) =>
                          t.title
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((t) => (
                          <tr
                            key={t.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {t.title}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-medium">
                              @{t.profiles?.username}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    t.status === "approved"
                                      ? "default"
                                      : t.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={
                                    t.status === "approved"
                                      ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-none border-none font-medium text-xs"
                                      : "shadow-none font-medium text-xs border-none bg-gray-100 text-gray-700"
                                  }
                                >
                                  {t.status.toUpperCase()}
                                </Badge>
                                {t.deleted_at && (
                                  <Badge variant="destructive" className="shadow-none border-none font-medium text-xs">ডিলিটেড</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 font-medium bg-white"
                              >
                                <Link
                                  href={`/temple/${t.slug}`}
                                  target="_blank"
                                >
                                  দেখুন
                                </Link>
                              </Button>
                              {!t.deleted_at ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleTempleAction(t.id, "soft_delete")
                                  }
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                                  disabled={processingId === t.id}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> মুছুন
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleTempleAction(t.id, "restore")
                                  }
                                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                                  disabled={processingId === t.id}
                                >
                                  রিস্টোর
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-6">
              <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden">
                <div className="p-5 border-b bg-white flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-orange-500" /> রেজিস্টার্ড ইউজার
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-bold border-b">
                      <tr>
                        <th className="px-6 py-4 tracking-wider">প্রোফাইল</th>
                        <th className="px-6 py-4 tracking-wider">ইউজারনেম</th>
                        <th className="px-6 py-4 tracking-wider">রোল</th>
                        <th className="px-6 py-4 tracking-wider text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-gray-200 shadow-sm">
                                <AvatarImage src={u.avatar_url || ""} />
                                <AvatarFallback className="bg-orange-100 text-orange-700">U</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-800">
                                {u.full_name || "নাম নেই"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-medium">
                            @{u.username}
                          </td>
                          <td className="px-6 py-4">
                            {u.is_admin ? (
                              <Badge className="bg-purple-50 text-purple-700 border border-purple-200 shadow-none font-medium text-xs hover:bg-purple-100">
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="shadow-none font-medium text-xs border-gray-200 text-gray-600 bg-gray-50">User</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8 font-medium bg-white"
                            >
                              <Link
                                href={`/profile/${u.username}`}
                                target="_blank"
                              >
                                প্রোফাইল
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
