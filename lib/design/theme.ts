/**
 * Theme Configuration
 * Manages theme modes and provides theme utilities for The Phone Guys CRM
 */

import { tokens } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Brand
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  
  // Neutral
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  
  // Semantic
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;
  info: string;
  infoForeground: string;
  
  // UI Elements
  border: string;
  input: string;
  ring: string;
  
  // Status (Repair specific)
  statusNew: string;
  statusInProgress: string;
  statusOnHold: string;
  statusCompleted: string;
  statusCancelled: string;
}

export const lightTheme: ThemeColors = {
  // Backgrounds
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(0 0% 3.9%)',
  card: 'hsl(0 0% 100%)',
  cardForeground: 'hsl(0 0% 3.9%)',
  popover: 'hsl(0 0% 100%)',
  popoverForeground: 'hsl(0 0% 3.9%)',
  
  // Brand
  primary: 'hsl(187 100% 42%)', // Cyan
  primaryForeground: 'hsl(0 0% 100%)',
  accent: 'hsl(354 100% 62%)', // Red
  accentForeground: 'hsl(0 0% 100%)',
  
  // Neutral
  secondary: 'hsl(0 0% 96.1%)',
  secondaryForeground: 'hsl(0 0% 9%)',
  muted: 'hsl(0 0% 96.1%)',
  mutedForeground: 'hsl(0 0% 45.1%)',
  
  // Semantic
  success: 'hsl(158 64% 42%)',
  successForeground: 'hsl(0 0% 100%)',
  warning: 'hsl(38 92% 50%)',
  warningForeground: 'hsl(0 0% 100%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  destructiveForeground: 'hsl(0 0% 100%)',
  info: 'hsl(217 91% 60%)',
  infoForeground: 'hsl(0 0% 100%)',
  
  // UI Elements
  border: 'hsl(0 0% 89.8%)',
  input: 'hsl(0 0% 89.8%)',
  ring: 'hsl(187 100% 42%)', // Cyan focus ring
  
  // Status
  statusNew: tokens.colors.status.new,
  statusInProgress: tokens.colors.status.inProgress,
  statusOnHold: tokens.colors.status.onHold,
  statusCompleted: tokens.colors.status.completed,
  statusCancelled: tokens.colors.status.cancelled,
};

export const darkTheme: ThemeColors = {
  // Backgrounds (Navy-based)
  background: 'hsl(210 40% 10%)',
  foreground: 'hsl(0 0% 95%)',
  card: 'hsl(210 40% 13%)',
  cardForeground: 'hsl(0 0% 95%)',
  popover: 'hsl(210 40% 13%)',
  popoverForeground: 'hsl(0 0% 95%)',
  
  // Brand (stays vibrant)
  primary: 'hsl(187 100% 42%)', // Cyan
  primaryForeground: 'hsl(0 0% 100%)',
  accent: 'hsl(354 100% 62%)', // Red
  accentForeground: 'hsl(0 0% 100%)',
  
  // Neutral
  secondary: 'hsl(210 40% 20%)',
  secondaryForeground: 'hsl(0 0% 98%)',
  muted: 'hsl(210 40% 20%)',
  mutedForeground: 'hsl(0 0% 65%)',
  
  // Semantic (adjusted for dark)
  success: 'hsl(158 64% 52%)',
  successForeground: 'hsl(0 0% 100%)',
  warning: 'hsl(38 92% 60%)',
  warningForeground: 'hsl(0 0% 0%)',
  destructive: 'hsl(0 84% 70%)',
  destructiveForeground: 'hsl(0 0% 100%)',
  info: 'hsl(217 91% 70%)',
  infoForeground: 'hsl(0 0% 0%)',
  
  // UI Elements
  border: 'hsl(210 40% 20%)',
  input: 'hsl(210 40% 20%)',
  ring: 'hsl(187 100% 42%)', // Cyan focus ring
  
  // Status (slightly adjusted for dark)
  statusNew: tokens.colors.status.new,
  statusInProgress: tokens.colors.status.inProgress,
  statusOnHold: tokens.colors.gray[500],
  statusCompleted: tokens.colors.semantic.success.main,
  statusCancelled: tokens.colors.semantic.error.main,
};

/**
 * Get the current theme mode from localStorage or system preference
 */
export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem('theme-mode') as ThemeMode;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  
  return 'system';
}

/**
 * Get the resolved theme (light or dark) based on mode
 */
export function getResolvedTheme(mode: ThemeMode = getThemeMode()): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return mode as 'light' | 'dark';
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Store the preference
  localStorage.setItem('theme-mode', theme);
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
  const current = getResolvedTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;
  
  const mode = getThemeMode();
  const resolved = getResolvedTheme(mode);
  applyTheme(resolved);
  
  // Listen for system theme changes if in system mode
  if (mode === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }
}

/**
 * Get theme colors for current mode
 */
export function getThemeColors(): ThemeColors {
  const theme = getResolvedTheme();
  return theme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Utility to generate Tailwind classes for status badges
 */
export function getStatusBadgeClasses(status: keyof typeof tokens.statusBadgeStyles): string {
  const styles = tokens.statusBadgeStyles[status];
  return `${styles.bg} ${styles.text} ${styles.border} border px-2 py-1 rounded-full text-xs font-medium`;
}

/**
 * Utility to generate Tailwind classes for priority badges
 */
export function getPriorityBadgeClasses(priority: keyof typeof tokens.priorityColors): string {
  const isDark = getResolvedTheme() === 'dark';
  
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  
  switch (priority) {
    case 'urgent':
      return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`;
    case 'high':
      return `${baseClasses} bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300`;
    case 'medium':
      return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`;
    case 'low':
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
    default:
      return baseClasses;
  }
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Generate HSL CSS string
 */
export function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

// Export theme utilities
export const theme = {
  colors: tokens.colors,
  spacing: tokens.spacing,
  typography: tokens.typography,
  shadows: tokens.shadows,
  borderRadius: tokens.borderRadius,
  breakpoints: tokens.breakpoints,
  animation: tokens.animation,
  
  // Theme functions
  getMode: getThemeMode,
  getResolved: getResolvedTheme,
  apply: applyTheme,
  toggle: toggleTheme,
  initialize: initializeTheme,
  getColors: getThemeColors,
  
  // Utility functions
  getStatusBadgeClasses,
  getPriorityBadgeClasses,
  hexToHSL,
  hslToString,
} as const;

export default theme;