'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BellRing, Loader2 } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { profile, session } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-24 px-4">
      <Navbar />
      <Card className="w-full max-w-2xl shadow-xl shadow-orange-100/50 rounded-3xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <BellRing className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">গ্লোবাল নোটিফিকেশন</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>যাদের কাছে যাবে</Label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">সব ইউজার</option>
              {/* Could add 'active', etc later */}
            </select>
          </div>

          <div className="space-y-2">
            <Label>টাইটেল</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="নোটিফিকেশনের টাইটেল" 
            />
          </div>

          <div className="space-y-2">
            <Label>মেসেজ</Label>
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="বিস্তারিত মেসেজ..." 
              className="min-h-32" 
            />
          </div>

          <div className="space-y-2">
            <Label>লিংক (ঐচ্ছিক)</Label>
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://... বা /temple/..." 
            />
          </div>

          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-lg h-12 mt-4" 
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <BellRing className="h-5 w-5 mr-2" />}
            পাঠান
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
