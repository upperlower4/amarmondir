'use client';

import React, { createContext, useContext, useState } from 'react';

interface TempleEditContextType {
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  openEditDialog: (step?: number) => void;
  setOpenEditDialog: (fn: (step?: number) => void) => void;
}

const TempleEditContext = createContext<TempleEditContextType | undefined>(undefined);

export function TempleEditProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [openEditFn, setOpenEditFn] = useState<(step?: number) => void>(() => () => {});

  return (
    <TempleEditContext.Provider 
      value={{ 
        isEditMode, 
        setIsEditMode, 
        openEditDialog: openEditFn,
        setOpenEditDialog: (fn) => setOpenEditFn(() => fn)
      }}
    >
      {children}
    </TempleEditContext.Provider>
  );
}

export function useTempleEdit() {
  const context = useContext(TempleEditContext);
  if (!context) throw new Error('useTempleEdit must be used within TempleEditProvider');
  return context;
}
