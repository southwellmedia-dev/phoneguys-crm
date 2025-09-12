'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CommentFiltersProps {
  onClose: () => void;
}

export function CommentFilters({ onClose }: CommentFiltersProps) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filters</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Advanced filtering coming soon...
      </p>
    </div>
  );
}