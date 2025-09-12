'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface HighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  highlightPattern?: RegExp;
  className?: string;
}

export function HighlightedTextarea({
  value,
  onChange,
  highlightPattern = /@(\w+)/g,
  className,
  ...props
}: HighlightedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Sync scroll position
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      setScrollTop(textareaRef.current.scrollTop);
    }
  };

  // Parse and highlight text
  const getHighlightedText = () => {
    if (!value) return '';
    
    const parts = value.split(highlightPattern);
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text - preserve whitespace and newlines
        const text = parts[i];
        if (text) {
          // Replace newlines with <br> and spaces with &nbsp; for proper rendering
          const lines = text.split('\n');
          lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
              result.push(<br key={`br-${i}-${lineIndex}`} />);
            }
            if (line) {
              // Preserve spaces
              const preservedLine = line.replace(/ /g, '\u00A0'); // Non-breaking space
              result.push(<span key={`text-${i}-${lineIndex}`}>{preservedLine}</span>);
            }
          });
        }
      } else {
        // Username mention
        result.push(
          <span
            key={`mention-${i}`}
            className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold rounded px-0.5"
          >
            @{parts[i]}
          </span>
        );
      }
    }
    
    return result;
  };

  useEffect(() => {
    if (textareaRef.current && highlightRef.current) {
      // Sync dimensions
      const textarea = textareaRef.current;
      const highlight = highlightRef.current;
      
      highlight.style.width = `${textarea.offsetWidth}px`;
      highlight.style.height = `${textarea.offsetHeight}px`;
    }
  }, [value]);

  return (
    <div className="relative">
      {/* Highlight layer (behind textarea) */}
      <div
        ref={highlightRef}
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words",
          "p-3 text-sm font-mono", // Match textarea styling
          "border border-transparent", // Match border for alignment
          className
        )}
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          letterSpacing: 'inherit',
          wordSpacing: 'inherit',
        }}
      >
        <div className="text-transparent">
          {getHighlightedText()}
        </div>
      </div>
      
      {/* Actual textarea (transparent background) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        className={cn(
          "relative bg-transparent caret-foreground",
          className
        )}
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
        }}
        {...props}
      />
    </div>
  );
}