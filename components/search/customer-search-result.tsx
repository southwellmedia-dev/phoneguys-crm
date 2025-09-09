'use client';

import React from 'react';
import { User, Mail, Phone, Package } from 'lucide-react';
import { SearchResult } from '@/lib/services/global-search.service';
import { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CustomerSearchResultProps {
  result: SearchResult;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CustomerSearchResult({ result, isSelected, onClick }: CustomerSearchResultProps) {
  const customer = result.data as Customer;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
        "hover:bg-primary/5 dark:hover:bg-primary/10",
        isSelected && "bg-primary/10 dark:bg-primary/20"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 p-2 rounded-md transition-colors",
        "bg-primary/10 text-primary",
        "group-hover:bg-primary/20"
      )}>
        <User className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {result.title}
          </span>
          {customer.is_business && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Business
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-0.5">
          {customer.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {customer.address && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {customer.address}
          </div>
        )}
      </div>

      {/* Action hint */}
      <div className={cn(
        "text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        Enter →
      </div>
    </div>
  );
}