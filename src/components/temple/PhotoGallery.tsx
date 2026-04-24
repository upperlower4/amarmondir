'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LightboxProps {
  photos: { id: string; url: string; caption?: string }[];
  initialIndex?: number;
}

export function PhotoGallery({ photos }: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (!photos || photos.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.slice(0, 6).map((photo, idx) => {
          const isLast = idx === 5 && photos.length > 6;
          
          return (
            <div
              key={photo.id}
              onClick={() => openLightbox(idx)}
              className={`relative rounded-xl overflow-hidden group border border-gray-200/60 cursor-pointer ${
                idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-square'
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.caption || "Gallery photo"}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white font-bold transition-colors group-hover:bg-black/70">
                  <Maximize2 className="h-6 w-6 mb-2" />
                  <span>+{photos.length - 6} আরও ছবি</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-none bg-black/95 rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative h-[80vh] flex items-center justify-center group">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12 hidden md:flex"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12 hidden md:flex"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <div className="relative w-full h-full p-4 md:p-8">
               <Image
                src={photos[currentIndex].url}
                alt={photos[currentIndex].caption || "Gallery photo"}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {photos[currentIndex].caption && (
               <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                  <p className="text-white font-medium text-lg">{photos[currentIndex].caption}</p>
               </div>
            )}
            
            <div className="absolute top-4 left-4 bg-black/40 px-3 py-1 rounded-full text-white text-xs font-mono">
              {currentIndex + 1} / {photos.length}
            </div>
            
            {/* Mobile swipe-like nav */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 md:hidden">
               <Button onClick={prevPhoto} variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white border-white/20">
                  <ChevronLeft className="h-5 w-5" />
               </Button>
               <Button onClick={nextPhoto} variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white border-white/20">
                  <ChevronRight className="h-5 w-5" />
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
