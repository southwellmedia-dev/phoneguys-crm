'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Search, Command } from 'lucide-react';
import { useSearch } from '@/lib/contexts/search-context';
import { cn } from '@/lib/utils';

interface SearchFeatureCardProps {
  className?: string;
}

export function SearchFeatureCard({ className }: SearchFeatureCardProps) {
  const { openSearch } = useSearch();
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Detect OS for keyboard shortcut display
  const isMac = React.useMemo(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    }
    return false;
  }, []);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-600",
        "hover:from-cyan-600 hover:to-cyan-700 hover:shadow-xl hover:scale-[1.02]",
        "group",
        className
      )}
      onClick={openSearch}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pattern for visual interest */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col justify-between text-white">
        {/* Top section with icon and title */}
        <div>
          <div className="mb-4">
            <div className={cn(
              "inline-flex p-3 rounded-lg bg-white/20 backdrop-blur-sm",
              "transition-transform duration-300",
              isHovered && "transform rotate-3 scale-110"
            )}>
              <Search className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">
            Global Search
          </h3>
          
          <p className="text-white/90 text-sm leading-relaxed">
            Instantly search appointments, tickets, and customers from anywhere in the app
          </p>
        </div>

        {/* Bottom section with keyboard shortcut */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm">Press</span>
            <div className="inline-flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
              {isMac ? (
                <>
                  <Command className="h-4 w-4" />
                  <span className="text-lg font-bold">K</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold">Ctrl</span>
                  <span className="text-white/60">+</span>
                  <span className="text-lg font-bold">K</span>
                </>
              )}
            </div>
            <span className="text-white/80 text-sm">to search</span>
          </div>
          
          {/* Hover hint */}
          <div className={cn(
            "mt-3 text-xs text-white/70 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            Click to open search now →
          </div>
        </div>

        {/* Decorative elements */}
        <div className={cn(
          "absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full",
          "transition-transform duration-500",
          isHovered && "transform scale-150"
        )} />
        <div className={cn(
          "absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full",
          "transition-transform duration-700",
          isHovered && "transform scale-125"
        )} />
      </div>
    </Card>
  );
}