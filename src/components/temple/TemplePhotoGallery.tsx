"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function TemplePhotoGallery({
  coverImage,
  title,
  photos,
}: {
  coverImage?: string | null;
  title: string;
  photos: any[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Combine cover image and photos into one array for the lightbox
  const allImages = [];
  if (coverImage) {
    allImages.push({ id: "cover", url: coverImage });
  } else {
    allImages.push({
      id: "cover",
      url: "https://picsum.photos/seed/temple/1920/1080",
    });
  }
  if (photos && photos.length > 0) {
    allImages.push(...photos);
  }

  // Handle keyboard navigation and body scroll lock
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : allImages.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev !== null && prev < allImages.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, allImages.length]);

  return (
    <>
      <div className="flex flex-col space-y-12">
        {/* Hero Image */}
        <div
          className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl md:rounded-3xl overflow-hidden bg-gray-100 border border-gray-200/60 shadow-sm cursor-pointer group"
          onClick={() => setSelectedIndex(0)}
        >
          <Image
            src={allImages[0].url}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Photo Gallery */}
        {photos && photos.length > 0 && (
          <section>
            <h2 className="text-2xl flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-orange-500" /> গ্যালারি
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.slice(0, 6).map((photo: any, idx: number) => {
                // The index in allImages array will be +1 because cover image is at 0
                const lightboxIndex = idx + 1;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedIndex(lightboxIndex)}
                    className={`relative rounded-xl overflow-hidden group border border-gray-200/60 cursor-pointer ${
                      idx === 0
                        ? "col-span-2 row-span-2 aspect-[4/3] md:aspect-auto"
                        : "aspect-square"
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`${title} photo`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full z-50 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : allImages.length - 1,
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full z-50 transition"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev !== null && prev < allImages.length - 1 ? prev + 1 : 0,
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/50 p-3 rounded-full z-50 transition"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div
              className="relative w-full h-full p-4 md:p-12"
              onClick={() => setSelectedIndex(null)}
            >
              <Image
                src={allImages[selectedIndex].url}
                alt={`${title} lightbox photo`}
                fill
                className="object-contain"
                sizes="100vw"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 bg-black/50 px-4 py-1.5 rounded-full text-sm font-medium">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
