'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function GalleryTrigger() {
  const scrollToGallery = () => {
    const el = document.getElementById('full-gallery');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button 
      onClick={scrollToGallery}
      className="w-full aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-colors group"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Sparkles className="h-6 w-6 text-orange-400 group-hover:text-orange-500 transition-colors" />
      </motion.div>
      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">More Photos</span>
    </button>
  );
}
