'use client';

import React from 'react';
import { FileText, User, Smartphone, AlertCircle } from 'lucide-react';
import { SearchResult } from '@/lib/services/global-search.service';
import { RepairTicket } from '@/lib/types';
import { StatusBadge } from '@/components/premium';
import { cn } from '@/lib/utils';

interface TicketSearchResultProps {
  result: SearchResult;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TicketSearchResult({ result, isSelected, onClick }: TicketSearchResultProps) {
  const ticket = result.data as RepairTicket;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

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
        "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
        "group-hover:bg-orange-200 dark:group-hover:bg-orange-900"
      )}>
        <FileText className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">
            Ticket {result.title}
          </span>
          {ticket.status && (
            <StatusBadge 
              status={ticket.status as any} 
              variant="soft"
              size="sm"
            />
          )}
          {ticket.priority && (
            <span className={cn(
              "text-xs font-medium capitalize",
              getPriorityColor(ticket.priority)
            )}>
              {ticket.priority === 'urgent' && <AlertCircle className="inline h-3 w-3 mr-0.5" />}
              {ticket.priority}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{result.subtitle.split(' - ')[0]}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            <span>{ticket.device_brand} {ticket.device_model}</span>
          </div>
        </div>

        {ticket.description && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {ticket.description}
          </div>
        )}

        {ticket.date_received && (
          <div className="text-xs text-muted-foreground mt-1">
            Received: {new Date(ticket.date_received).toLocaleDateString()}
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