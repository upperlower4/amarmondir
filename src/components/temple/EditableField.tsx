'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface EditableFieldProps {
  templeId: string;
  field: string;
  label: string;
  currentValue: string;
  children: React.ReactNode;
  multiline?: boolean;
  editMode?: boolean;
}

export function EditableField({ templeId, field, label, currentValue, children, multiline = false, editMode = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue || '');
  const [loading, setLoading] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

  const displayValue = optimisticValue !== null ? optimisticValue : currentValue;

  const handleSave = async () => {
    if (value === currentValue) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('তথ্য আপডেট করতে আপনাকে লগইন করতে হবে।');
      }

      const res = await fetch(`/api/temples/${templeId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ suggestedData: { [field]: value } })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'আপডেট করতে সমস্যা হয়েছে');

      setOptimisticValue(value);
      toast.success('সফলভাবে আপডেট করা হয়েছে', {
        description: 'অ্যাডমিন ভেরিফাইয়ের পর এটি চূড়ান্ত হবে।'
      });
      setIsEditing(false);
    } catch (err: any) {
      toast.error('ত্রুটি', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 relative w-full bg-orange-50/50 p-3 rounded-xl border border-orange-100 mt-2">
        <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">এডিট করছেন: {label}</span>
        {multiline ? (
          <Textarea 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            className="text-sm bg-white min-h-[120px]" 
            autoFocus 
          />
        ) : (
          <Input 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            className="h-9 text-sm bg-white" 
            autoFocus 
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <Button size="sm" onClick={handleSave} disabled={loading} className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white shadow-sm">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />} সেভ করুন
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setValue(displayValue || ''); }} disabled={loading} className="h-8 px-4 border-gray-200 hover:bg-gray-100 text-gray-700">
            <X className="w-3.5 h-3.5 mr-1.5" /> বাতিল
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative w-full flex items-start gap-3">
      <div className="flex-1 min-w-0 relative">
        {children}
        {optimisticValue !== null && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
            <strong>আপনার আপডেট:</strong> {optimisticValue.length > 50 ? optimisticValue.substring(0, 50) + '...' : optimisticValue} (অপেক্ষমান)
          </div>
        )}
      </div>
      {editMode && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 shrink-0 transition-all rounded-lg border bg-orange-100 text-orange-600 border-orange-200"
          title={`${label} আপডেট করুন`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
