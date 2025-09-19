'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/lib/contexts/search-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SearchHintBannerProps {
  className?: string;
}

export function SearchHintBanner({ className }: SearchHintBannerProps) {
  const { openSearch } = useSearch();
  const [isVisible, setIsVisible] = React.useState(true);
  
  // Detect OS for keyboard shortcut display
  const isMac = React.useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    }
    return false;
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "relative bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30",
        "border-b border-cyan-200/50 dark:border-cyan-800/50",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div className="px-6 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={openSearch}
            className="flex items-center gap-3 text-sm hover:opacity-80 transition-opacity flex-1"
          >
            <Search className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-gray-700 dark:text-gray-300">
              Quick search for tickets, customers, and appointments
            </span>
            <div className="flex items-center gap-1 ml-2">
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                {isMac ? '⌘' : 'Ctrl'}
              </kbd>
              <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                K
              </kbd>
            </div>
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}