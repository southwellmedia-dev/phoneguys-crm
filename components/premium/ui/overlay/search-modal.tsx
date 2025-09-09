'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, FileText, Calendar, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalSearch, useRecentSearches, useSearchNavigation } from '@/lib/hooks/use-global-search';
import { SearchResult } from '@/lib/services/global-search.service';
import { CustomerSearchResult } from '@/components/search/customer-search-result';
import { TicketSearchResult } from '@/components/search/ticket-search-result';
import { AppointmentSearchResult } from '@/components/search/appointment-search-result';
import { SearchEmptyState } from '@/components/search/search-empty-state';
import { SearchSkeleton } from '@/components/search/search-skeleton';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchModal({ open = false, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    data: searchResults, 
    isSearching,
    hasSearched,
    query: debouncedQuery 
  } = useGlobalSearch(searchQuery, {
    enabled: isOpen,
    debounceMs: 300
  });

  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch
  } = useRecentSearches();

  const handleSelect = useCallback((result: SearchResult) => {
    // Add to recent searches
    if (searchQuery) {
      addRecentSearch(searchQuery);
    }
    
    // Close modal
    setIsOpen(false);
    onOpenChange?.(false);
    
    // Navigate to result
    router.push(result.url);
  }, [searchQuery, addRecentSearch, router, onOpenChange]);

  const { selectedIndex, setSelectedIndex } = useSearchNavigation(
    searchResults?.results || [],
    handleSelect
  );

  // Handle external open state changes
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        onOpenChange?.(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closing
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [isOpen, setSelectedIndex]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    inputRef.current?.focus();
  };

  // Group results by type
  const groupedResults = searchResults?.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const renderSearchResult = (result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    const commonProps = {
      result,
      isSelected,
      onClick: () => handleSelect(result)
    };

    switch (result.type) {
      case 'customer':
        return <CustomerSearchResult key={result.id} {...commonProps} />;
      case 'ticket':
        return <TicketSearchResult key={result.id} {...commonProps} />;
      case 'appointment':
        return <AppointmentSearchResult key={result.id} {...commonProps} />;
      default:
        return null;
    }
  };

  let resultIndex = 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers, tickets, appointments..."
          className={cn(
            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none",
            "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        {isSearching && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <button
          onClick={() => handleOpenChange(false)}
          className="ml-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {isSearching && !searchResults ? (
          <SearchSkeleton />
        ) : searchResults && searchResults.results.length > 0 ? (
          <div className="p-2">
            {groupedResults?.customer && groupedResults.customer.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Customers</span>
                  <span className="text-xs text-muted-foreground">({groupedResults.customer.length})</span>
                </div>
                <div className="mb-3">
                  {groupedResults.customer.map((result) => {
                    const currentIndex = resultIndex++;
                    return renderSearchResult(result, currentIndex);
                  })}
                </div>
              </>
            )}

            {groupedResults?.ticket && groupedResults.ticket.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Tickets</span>
                  <span className="text-xs text-muted-foreground">({groupedResults.ticket.length})</span>
                </div>
                <div className="mb-3">
                  {groupedResults.ticket.map((result) => {
                    const currentIndex = resultIndex++;
                    return renderSearchResult(result, currentIndex);
                  })}
                </div>
              </>
            )}

            {groupedResults?.appointment && groupedResults.appointment.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Appointments</span>
                  <span className="text-xs text-muted-foreground">({groupedResults.appointment.length})</span>
                </div>
                <div className="mb-3">
                  {groupedResults.appointment.map((result) => {
                    const currentIndex = resultIndex++;
                    return renderSearchResult(result, currentIndex);
                  })}
                </div>
              </>
            )}

            {searchResults.searchTime && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border">
                Found {searchResults.totalCount} results in {searchResults.searchTime}ms
              </div>
            )}
          </div>
        ) : (
          <SearchEmptyState
            query={debouncedQuery}
            hasSearched={hasSearched}
            recentSearches={recentSearches}
            onRecentSearchClick={handleRecentSearchClick}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
            Close
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}