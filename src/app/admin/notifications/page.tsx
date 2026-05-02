'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { BellRing, Loader2, Send, History, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminNotificationsPage() {
  const { profile, session } = useAuth();
  const router = useRouter();

  // New Notification State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [notifyOnNewTemple, setNotifyOnNewTemple] = useState(true);
  const [pushRateLimit, setPushRateLimit] = useState(5);
  const [pointsTempleAdd, setPointsTempleAdd] = useState(10);
  const [pointsEditApproved, setPointsEditApproved] = useState(5);
  const [pointsPhotoApproved, setPointsPhotoApproved] = useState(2);
  const [pointsRejectionPenalty, setPointsRejectionPenalty] = useState(5);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        const data = await res.json();
        if (data.settings) {
          setNotifyOnNewTemple(data.settings.notify_on_new_temple);
          setPushRateLimit(data.settings.push_rate_limit);
          setPointsTempleAdd(data.settings.points_temple_add ?? 10);
          setPointsEditApproved(data.settings.points_edit_approved ?? 5);
          setPointsPhotoApproved(data.settings.points_photo_approved ?? 2);
          setPointsRejectionPenalty(data.settings.points_rejection_penalty ?? 5);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (profile?.is_admin && session?.access_token) {
      fetchSettings();
    }
  }, [profile, session]);

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          notify_on_new_temple: notifyOnNewTemple, 
          push_rate_limit: pushRateLimit,
          points_temple_add: pointsTempleAdd,
          points_edit_approved: pointsEditApproved,
          points_photo_approved: pointsPhotoApproved,
          points_rejection_penalty: pointsRejectionPenalty
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('সেটিংস সেভ হয়েছে');
    } catch (e) {
      toast.error('সেটিংস সেভ করা যায়নি');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-500 font-medium">Access Denied</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('টাইটেল এবং মেসেজ দিন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ title, body, url, target })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('নোটিফিকেশন পাঠানো হয়েছে');
      setTitle('');
      setBody('');
      setUrl('');
    } catch (e: any) {
      toast.error(e.message || 'নোটিফিকেশন পাঠানো যায়নি');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-24 px-4 pb-20">
      <Navbar />
      
      <div className="w-full max-w-4xl mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> ফিরে যান
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <BellRing className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-900">নোটিফিকেশন সেন্টার</h1>
            <p className="text-gray-500">ম্যানুয়াল নোটিফিকেশন পাঠান এবং সেটিংস পরিবর্তন করুন</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <Tabs defaultValue="send" className="w-full space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl">
            <TabsTrigger value="send" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"><Send className="h-4 w-4 mr-2" /> ম্যানুয়াল নোটিফিকেশন</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"><Settings className="h-4 w-4 mr-2" /> সেটিংস</TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="text-xl">নতুন নোটিফিকেশন পাঠান</CardTitle>
                <CardDescription>সব ইউজার বা নির্দিষ্ট ইউজারদের রিয়েল-টাইম পুশ নোটিফিকেশন পাঠান</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>কাদের কাছে যাবে?</Label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full h-11 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  >
                    <option value="all">সব ইউজার (All Registered Users)</option>
                    {/* Add options based on roles or activity later */}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>শিরোনাম (Title)</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="যেমনঃ নতুন আপডেট এসেছে!" 
                    className="h-11 rounded-lg"
                    maxLength={100}
                  />
                  <div className="text-xs text-right text-gray-400">{title.length}/100</div>
                </div>

                <div className="space-y-2">
                  <Label>মেসেজ (Message Body)</Label>
                  <Textarea 
                    value={body} 
                    onChange={(e) => setBody(e.target.value)} 
                    placeholder="নোটিফিকেশনের বিস্তারিত মেসেজ লিখুন..." 
                    className="min-h-32 rounded-lg resize-y" 
                    maxLength={300}
                  />
                  <div className="text-xs text-right text-gray-400">{body.length}/300</div>
                </div>

                <div className="space-y-2">
                  <Label>লিংক (ঐচ্ছিক - ঐ লিংকে নিয়ে যাবে)</Label>
                  <Input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="যেমনঃ /temples বা https://..." 
                    className="h-11 rounded-lg text-blue-600 placeholder:text-gray-400"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-lg h-12 rounded-xl shadow-lg shadow-orange-200 transition-all font-medium" 
                    onClick={handleSend}
                    disabled={loading || !title.trim() || !body.trim()}
                  >
                    {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                    এখনই পাঠান
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-50">
                <CardTitle className="text-xl">নোটিফিকেশন সেটিংস</CardTitle>
                <CardDescription>সিস্টেম অটোমেটিক নোটিফিকেশন এবং লিমিট ম্যানেজ করুন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <Label className="text-base">নতুন মন্দির সাবমিশন</Label>
                    <p className="text-sm text-gray-500">কেউ নতুন মন্দির যোগ করলে মডারেটরদের নোটিফাই করুন</p>
                  </div>
                  <Switch 
                    checked={notifyOnNewTemple}
                    onCheckedChange={setNotifyOnNewTemple} 
                  />
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <Label className="text-base">দৈনিক পুশ লিমিট (Push Rate Limit)</Label>
                    <p className="text-sm text-gray-500">প্রতিদিন একজন ইউজারকে সর্বোচ্চ কয়টি পুশ নোটিফিকেশন পাঠানো যাবে</p>
                  </div>
                  <div className="flex items-center gap-4 max-w-xs">
                    <Input 
                      type="number" 
                      value={pushRateLimit}
                      onChange={(e) => setPushRateLimit(parseInt(e.target.value) || 0)}
                      min={1}
                      max={50}
                      className="h-11 bg-white font-mono text-center"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <Label className="text-base">পয়েন্ট সেটিংস</Label>
                    <p className="text-sm text-gray-500">বিভিন্ন অবদানের জন্য ইউজারদের কত পয়েন্ট দেওয়া হবে তা নির্ধারণ করুন। এখানে পরিবর্তন করলে শুধুমাত্র নতুন অবদানের পয়েন্ট পরিবর্তিত হবে, পুরনো অবদানে আগের পয়েন্টই থাকবে।</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">নতুন মন্দির এপ্রুভ (পয়েন্ট)</Label>
                      <Input 
                        type="number" 
                        value={pointsTempleAdd}
                        onChange={(e) => setPointsTempleAdd(parseInt(e.target.value) || 0)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">এডিট সাজেশন এপ্রুভ (পয়েন্ট)</Label>
                      <Input 
                        type="number" 
                        value={pointsEditApproved}
                        onChange={(e) => setPointsEditApproved(parseInt(e.target.value) || 0)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">ফোটো এপ্রুভ (পয়েন্ট)</Label>
                      <Input 
                        type="number" 
                        value={pointsPhotoApproved}
                        onChange={(e) => setPointsPhotoApproved(parseInt(e.target.value) || 0)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">রিজেক্ট পেনাল্টি (পয়েন্ট)</Label>
                      <Input 
                        type="number" 
                        value={pointsRejectionPenalty}
                        onChange={(e) => setPointsRejectionPenalty(parseInt(e.target.value) || 0)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button onClick={saveSettings} disabled={settingsLoading} className="w-full sm:w-auto h-11 px-8">
                    {settingsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    সেটিংস সেভ করুন
                  </Button>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
