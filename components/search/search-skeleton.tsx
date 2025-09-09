'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function SearchSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg">
      {/* Icon skeleton */}
      <div className="mt-0.5 p-2 rounded-md bg-muted animate-pulse">
        <div className="h-4 w-4" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-3 w-48 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}