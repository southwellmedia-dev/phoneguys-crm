'use client';

import React from 'react';

/**
 * Parse comment content and convert @mentions to styled spans
 */
export function parseCommentContent(content: string): React.ReactNode {
  if (!content) return null;
  
  // Regular expression to match @username mentions
  const mentionRegex = /@(\w+)/g;
  
  const parts = content.split(mentionRegex);
  const result: React.ReactNode[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Regular text
      if (parts[i]) {
        result.push(parts[i]);
      }
    } else {
      // Username mention
      result.push(
        <span
          key={`mention-${i}`}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          title={`@${parts[i]} has been mentioned`}
        >
          @{parts[i]}
        </span>
      );
    }
  }
  
  return <>{result}</>;
}

/**
 * Extract mentioned usernames from content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}