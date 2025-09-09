'use client';

import React from 'react';
import { Search, Clock, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchEmptyStateProps {
  query?: string;
  hasSearched?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
}

export function SearchEmptyState({ 
  query, 
  hasSearched,
  recentSearches = [],
  onRecentSearchClick 
}: SearchEmptyStateProps) {
  if (query && hasSearched) {
    // No results found
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-3 rounded-full bg-muted mb-4">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">
          No results found
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          No results found for "{query}". Try searching with different keywords.
        </p>
        
        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Search tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Search by customer name, email, or phone</li>
            <li>• Use ticket numbers like "TKT-2024-001"</li>
            <li>• Search by device brand or model</li>
            <li>• Try partial matches or keywords</li>
          </ul>
        </div>
      </div>
    );
  }

  // Initial state - show recent searches and suggestions
  return (
    <div className="py-4">
      {recentSearches.length > 0 && (
        <div className="px-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
          </div>
          <div className="space-y-1">
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => onRecentSearchClick?.(search)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm",
                  "text-foreground hover:bg-muted transition-colors"
                )}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Quick actions</span>
        </div>
        <div className="space-y-1">
          <QuickAction
            label="View all open tickets"
            description="See tickets with 'new' or 'in_progress' status"
            onClick={() => window.location.href = '/orders?status=new,in_progress'}
          />
          <QuickAction
            label="Today's appointments"
            description="View all appointments scheduled for today"
            onClick={() => window.location.href = '/appointments?date=today'}
          />
          <QuickAction
            label="Recent customers"
            description="Browse recently added customers"
            onClick={() => window.location.href = '/customers'}
          />
        </div>
      </div>

      <div className="px-3 mt-4 pt-4 border-t border-border">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Search tips</p>
            <p>Type to search across customers, tickets, and appointments. Use arrow keys to navigate results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ 
  label, 
  description, 
  onClick 
}: { 
  label: string; 
  description: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-md",
        "hover:bg-muted transition-colors group"
      )}
    >
      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {label}
      </div>
      <div className="text-xs text-muted-foreground">
        {description}
      </div>
    </button>
  );
}