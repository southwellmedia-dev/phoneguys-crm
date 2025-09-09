'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, FileText, Calendar, Loader2, ArrowRight, Command } from 'lucide-react';
import { useGlobalSearch, useRecentSearches } from '@/lib/hooks/use-global-search';
import { SearchResult } from '@/lib/services/global-search.service';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalPremiumProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchModalPremium({ open = false, onOpenChange }: SearchModalPremiumProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(open);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { 
    data: searchResults, 
    isSearching,
    hasSearched,
    query: debouncedQuery 
  } = useGlobalSearch(searchQuery, {
    enabled: isOpen,
    debounceMs: 200
  });

  const {
    recentSearches,
    addRecentSearch,
  } = useRecentSearches();

  // Handle external open state changes
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle modal open/close
        if (isOpen) {
          handleClose();
        } else {
          setIsOpen(true);
          onOpenChange?.(true);
        }
      }

      // Handle Escape
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

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
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !searchResults?.results) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const results = searchResults.results;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = prev + 1;
            return next >= results.length ? 0 : next;
          });
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = prev - 1;
            return next < 0 ? results.length - 1 : next;
          });
          break;
        
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleSelect = useCallback((result: SearchResult) => {
    // Add to recent searches
    if (searchQuery) {
      addRecentSearch(searchQuery);
    }
    
    // Close modal
    handleClose();
    
    // Navigate to result
    router.push(result.url);
  }, [searchQuery, addRecentSearch, router]);

  // Group results by type
  const groupedResults = searchResults?.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer': return User;
      case 'ticket': return FileText;
      case 'appointment': return Calendar;
      default: return Search;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Customers';
      case 'ticket': return 'Tickets';
      case 'appointment': return 'Appointments';
      default: return 'Results';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50';
      case 'ticket': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50';
      case 'appointment': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/50';
    }
  };

  let resultIndex = -1;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl">
              <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                {/* Search Header */}
                <div className="relative border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center px-5 py-4">
                    <Search className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customers, tickets, appointments..."
                      className="flex-1 bg-transparent text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
                    />
                    {isSearching && (
                      <Loader2 className="mr-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                    <button
                      onClick={handleClose}
                      className="ml-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div 
                  ref={resultsRef}
                  className="max-h-[400px] overflow-y-auto"
                >
                  {/* Loading State */}
                  {isSearching && !searchResults && (
                    <div className="px-5 py-8">
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                              <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800/50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!isSearching && searchResults && searchResults.results.length === 0 && debouncedQuery && (
                    <div className="px-5 py-12 text-center">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No results found for "{debouncedQuery}"
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}

                  {/* Results List */}
                  {!isSearching && searchResults && searchResults.results.length > 0 && (
                    <div className="py-2">
                      {Object.entries(groupedResults || {}).map(([type, results]) => {
                        const Icon = getIcon(type);
                        return (
                          <div key={type}>
                            <div className="px-5 py-2">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {getTypeLabel(type)}
                              </p>
                            </div>
                            {results.map((result) => {
                              resultIndex++;
                              const isSelected = resultIndex === selectedIndex;
                              
                              return (
                                <button
                                  key={result.id}
                                  onClick={() => handleSelect(result)}
                                  className={cn(
                                    "w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                                    isSelected && "bg-gray-50 dark:bg-gray-800/50"
                                  )}
                                >
                                  <div className={cn(
                                    "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                                    getTypeColor(type)
                                  )}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {result.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {result.subtitle}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <ArrowRight className="shrink-0 h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Recent Searches / Suggestions when no query */}
                  {!searchQuery && !isSearching && (
                    <div className="py-2">
                      {recentSearches.length > 0 && (
                        <>
                          <div className="px-5 py-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Recent Searches
                            </p>
                          </div>
                          {recentSearches.slice(0, 3).map((search, index) => (
                            <button
                              key={index}
                              onClick={() => setSearchQuery(search)}
                              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <div className="shrink-0 h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <p className="flex-1 text-left text-sm text-gray-600 dark:text-gray-300">
                                {search}
                              </p>
                            </button>
                          ))}
                        </>
                      )}
                      
                      <div className="px-5 py-2 mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quick Actions
                        </p>
                      </div>
                      <button
                        onClick={() => { handleClose(); router.push('/orders?status=new'); }}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="shrink-0 h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="flex-1 text-left text-sm text-gray-600 dark:text-gray-300">
                          View open tickets
                        </p>
                      </button>
                      <button
                        onClick={() => { handleClose(); router.push('/appointments?date=today'); }}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="shrink-0 h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="flex-1 text-left text-sm text-gray-600 dark:text-gray-300">
                          Today's appointments
                        </p>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">↑↓</kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">↵</kbd>
                        Select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">ESC</kbd>
                        Close
                      </span>
                    </div>
                    {searchResults && searchResults.searchTime && (
                      <span>
                        {searchResults.results.length} results in {searchResults.searchTime}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}