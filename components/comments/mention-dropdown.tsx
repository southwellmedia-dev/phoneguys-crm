'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface MentionDropdownProps {
  users: User[];
  selectedIndex: number;
  onSelect: (user: User) => void;
  position?: { top: number; left: number };
}

export function MentionDropdown({
  users,
  selectedIndex,
  onSelect,
  position
}: MentionDropdownProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && users[selectedIndex]) {
        e.preventDefault();
        onSelect(users[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect]);

  if (users.length === 0) return null;

  return (
    <div 
      className="absolute z-50 w-80 bg-popover border rounded-lg shadow-xl py-1 max-h-60 overflow-y-auto"
      style={position}
    >
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b mb-1">
        Select user to mention
      </div>
      {users.map((user, index) => (
        <button
          key={user.id}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left",
            index === selectedIndex && "bg-muted"
          )}
          onClick={() => onSelect(user)}
        >
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">@{user.username}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.full_name} • {user.email}
            </p>
          </div>
        </button>
      ))}
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-t mt-1">
        Use ↑↓ to navigate • Enter to select • Esc to close
      </div>
    </div>
  );
}