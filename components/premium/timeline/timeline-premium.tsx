'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Clock, MessageCircle, AlertCircle, Package, User } from 'lucide-react';

export interface TimelineEvent {
  id?: string;
  timestamp: string;
  type: 'status_change' | 'comment' | 'update' | 'created' | 'completed';
  title: string;
  description?: string;
  status?: string;
  user?: string;
  is_customer?: boolean;
  icon?: React.ReactNode;
}

interface TimelinePremiumProps {
  events: TimelineEvent[];
  className?: string;
}

export function TimelinePremium({ events, className }: TimelinePremiumProps) {
  const getEventIcon = (event: TimelineEvent) => {
    if (event.icon) return event.icon;
    
    switch (event.type) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'status_change':
        return <Package className="h-5 w-5 text-cyan-600" />;
      case 'comment':
        return event.is_customer ? 
          <User className="h-5 w-5 text-green-600" /> : 
          <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'created':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventColors = (event: TimelineEvent) => {
    if (event.is_customer) {
      return {
        line: 'bg-green-200',
        dot: 'bg-green-500',
        card: 'bg-green-50 border-green-200',
        title: 'text-green-900',
        text: 'text-green-700'
      };
    }

    switch (event.type) {
      case 'completed':
        return {
          line: 'bg-green-200',
          dot: 'bg-green-500',
          card: 'bg-green-50 border-green-200',
          title: 'text-green-900',
          text: 'text-green-700'
        };
      case 'status_change':
        return {
          line: 'bg-cyan-200',
          dot: 'bg-cyan-500',
          card: 'bg-cyan-50 border-cyan-200',
          title: 'text-cyan-900',
          text: 'text-cyan-700'
        };
      case 'comment':
        return {
          line: 'bg-blue-200',
          dot: 'bg-blue-500',
          card: 'bg-blue-50 border-blue-200',
          title: 'text-blue-900',
          text: 'text-blue-700'
        };
      default:
        return {
          line: 'bg-gray-200',
          dot: 'bg-gray-400',
          card: 'bg-gray-50 border-gray-200',
          title: 'text-gray-900',
          text: 'text-gray-600'
        };
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline events to display
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {events.map((event, index) => {
        const colors = getEventColors(event);
        const isLast = index === events.length - 1;

        return (
          <div key={event.id || index} className="relative flex pb-8 last:pb-0">
            {/* Timeline line */}
            {!isLast && (
              <div 
                className={cn(
                  'absolute left-5 top-10 w-0.5 h-full -ml-px',
                  colors.line
                )}
              />
            )}

            {/* Icon container */}
            <div className="relative z-10 flex items-center justify-center flex-shrink-0 w-10 h-10 bg-white rounded-full shadow-sm ring-4 ring-white">
              {getEventIcon(event)}
            </div>

            {/* Content card */}
            <div className="flex-1 ml-4">
              <div className={cn(
                'relative p-4 rounded-lg border shadow-sm transition-all hover:shadow-md',
                colors.card
              )}>
                {/* Timestamp */}
                <div className="flex items-center justify-between mb-2">
                  <time className="text-xs font-medium text-gray-500">
                    {event.timestamp}
                  </time>
                  {event.user && (
                    <span className={cn('text-xs font-medium', colors.text)}>
                      {event.user}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className={cn('text-sm font-semibold mb-1', colors.title)}>
                  {event.title}
                </h4>

                {/* Description */}
                {event.description && (
                  <p className={cn('text-sm', colors.text)}>
                    {event.description}
                  </p>
                )}

                {/* Status badge if applicable */}
                {event.status && (
                  <div className="mt-2">
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                      colors.card,
                      'border',
                      colors.title
                    )}>
                      {event.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}