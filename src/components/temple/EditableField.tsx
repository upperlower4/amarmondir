'use client';

import { Pencil } from 'lucide-react';
import { useTempleEdit } from './TempleEditProvider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface EditableFieldProps {
  children: React.ReactNode;
  step?: number;
  className?: string;
  label?: string;
}

export function EditableField({ children, step = 1, className, label }: EditableFieldProps) {
  const { isEditMode, openEditDialog } = useTempleEdit();

  return (
    <div className={cn("relative group/editable", className)}>
      {children}
      <AnimatePresence>
        {isEditMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => openEditDialog(step)}
            className="absolute -top-3 -right-3 z-50 bg-orange-500 text-white p-2 rounded-full shadow-lg hover:bg-orange-600 transition-colors border-2 border-white"
            title={label ? `${label} এডিট করুন` : "এডিট করুন"}
          >
            <Pencil className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-dashed border-orange-400/30 rounded-xl pointer-events-none -m-2 z-10" />
      )}
    </div>
  );
}
