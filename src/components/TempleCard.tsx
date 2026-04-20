import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle2 } from 'lucide-react';
import type { Temple } from '@/lib/types';
import { getDivisionColor } from '@/lib/utils';

interface TempleCardProps {
  temple: Temple;
}

export function TempleCard({ temple }: TempleCardProps) {
  return (
    <Link href={`/temple/${temple.slug}`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-shadow border-none shadow-orange-100/50 shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={temple.cover_image || 'https://picsum.photos/seed/temple/800/500'}
            alt={temple.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={getDivisionColor(temple.division)}>
              {temple.division}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg leading-tight group-hover:text-orange-600 transition-colors">
                {temple.title}
              </h3>
              <p className="text-xs text-muted-foreground italic">{temple.english_name}</p>
            </div>
            {temple.status === 'approved' && (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span className="truncate">{temple.district}, {temple.upazila}</span>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 bengali-text mb-4">
            {temple.short_bio}
          </p>

          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
            {temple.temple_type}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
