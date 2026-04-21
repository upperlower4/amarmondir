import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase, isConfigured } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DistrictPage({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const decoded = decodeURIComponent(district);
  const temples = isConfigured
    ? (await supabase.from('temples').select('id, title, slug, division, temple_type, short_bio').eq('district', decoded).eq('status', 'approved').is('deleted_at', null).order('updated_at', { ascending: false })).data
    : [];
  return <><Navbar /><main className="flex-1 bg-[#fcfaf7] py-10"><div className="container mx-auto px-4"><div className="max-w-3xl mb-8"><Badge className="mb-4">{decoded}</Badge><h1 className="text-4xl font-bold font-serif mb-3">{decoded} জেলার মন্দিরসমূহ</h1><p className="text-gray-600">SEO friendly জেলা browse page — users can discover temples by district.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{(temples || []).map((item: any) => <Link href={`/temple/${item.slug}`} key={item.id}><Card className="h-full hover:shadow-md transition-shadow"><CardContent className="p-5"><p className="font-bold mb-2">{item.title}</p><p className="text-xs text-gray-500 mb-2">{item.division} · {item.temple_type}</p><p className="text-sm text-gray-600 line-clamp-3">{item.short_bio || 'বিস্তারিত বর্ণনা পরে যোগ করা হবে।'}</p></CardContent></Card></Link>)}</div>{!(temples || []).length && <div className="bg-white border rounded-3xl p-10 text-center text-gray-500 mt-6">এই জেলায় এখনো approved temple নেই।</div>}</div></main><Footer /></>;
}
