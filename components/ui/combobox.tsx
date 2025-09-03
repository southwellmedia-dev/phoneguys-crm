"use client";

import * as React from "react";
import { Check, ChevronDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    
    const searchLower = search.toLowerCase();
    return options.filter((option) => 
      option.label.toLowerCase().includes(searchLower) ||
      option.sublabel?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between text-left font-normal h-auto py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-foreground", className)}
        >
          <div className="flex-1">
            {selectedOption ? (
              <div className="flex flex-col gap-1">
                <span>{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="text-xs text-muted-foreground">{selectedOption.sublabel}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="mr-2 h-4 w-4 flex items-center justify-center">
                    {value === option.value ? (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <User className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}