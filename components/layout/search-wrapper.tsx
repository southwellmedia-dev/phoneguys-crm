'use client';

import React from 'react';
import { SearchModalPremium } from '@/components/premium/ui/overlay/search-modal-premium';
import { SearchProvider, useSearch } from '@/lib/contexts/search-context';

function SearchModalWrapper() {
  const { isOpen, closeSearch } = useSearch();
  
  return (
    <SearchModalPremium 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) closeSearch();
      }}
    />
  );
}

export function SearchWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      {children}
      <SearchModalWrapper />
    </SearchProvider>
  );
}