'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { SearchResult, SearchFilters, SearchResponse } from '@/lib/services/global-search.service';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

interface UseGlobalSearchOptions {
  enabled?: boolean;
  filters?: SearchFilters;
  debounceMs?: number;
}

export function useGlobalSearch(query: string, options: UseGlobalSearchOptions = {}) {
  const { 
    enabled = true, 
    filters = {}, 
    debounceMs = 300 
  } = options;
  
  // Debounce the search query
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  // Track if this is the initial load
  const [hasSearched, setHasSearched] = useState(false);

  const searchQuery = useQuery({
    queryKey: ['global-search', debouncedQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        ...(filters.types ? { types: filters.types.join(',') } : {}),
        ...(filters.limit ? { limit: filters.limit.toString() } : {})
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to search');
      }
      
      const result = await response.json() as SearchResponse;
      setHasSearched(true);
      return result;
    },
    enabled: enabled,
    staleTime: debouncedQuery ? 30 * 1000 : 5 * 60 * 1000, // 30s for searches, 5m for recent items
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    ...searchQuery,
    isSearching: searchQuery.isLoading || query !== debouncedQuery,
    hasSearched,
    query: debouncedQuery
  };
}

// Hook for managing recent searches
export function useRecentSearches() {
  const STORAGE_KEY = 'recent-searches';
  const MAX_RECENT = 10;

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  const addRecentSearch = useCallback((search: string) => {
    if (!search || search.trim().length === 0) return;

    setRecentSearches(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(s => s !== search);
      const updated = [search, ...filtered].slice(0, MAX_RECENT);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  const removeRecentSearch = useCallback((search: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== search);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch
  };
}

// Hook for managing selected search results
export function useSearchNavigation(results: SearchResult[], onSelect: (result: SearchResult) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!results || results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return next >= results.length ? 0 : next;
        });
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => {
          const next = prev - 1;
          return next < 0 ? results.length - 1 : next;
        });
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          onSelect(results[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  }, [results, selectedIndex, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex
  };
}