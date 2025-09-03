/**
 * Design System Tokens
 * Central repository for all design values used across The Phone Guys CRM
 */

// Brand Colors
export const colors = {
  brand: {
    cyan: {
      50: '#E0F7FA',
      100: '#B2EBF2',
      200: '#80DEEA',
      300: '#4DD0E1',
      400: '#26C6DA',
      500: '#00BCD4', // Primary brand color
      600: '#00ACC1',
      700: '#0097A7',
      800: '#00838F',
      900: '#006064',
    },
    red: {
      50: '#FFEBEE',
      100: '#FFCDD2',
      200: '#FF9BA3',
      300: '#FF6B75',
      400: '#FF535F',
      500: '#FF3B4A', // Accent color
      600: '#E63946',
      700: '#CC323F',
      800: '#B32B38',
      900: '#991F2B',
    },
    navy: {
      50: '#E8EAED',
      100: '#C5CAD1',
      200: '#9FA7B1',
      300: '#798491',
      400: '#5C6B7A',
      500: '#3F5263',
      600: '#2D3E50',
      700: '#1A2B3C', // Base navy
      800: '#14212E',
      900: '#0D1620',
    },
  },
  
  // Semantic Colors
  semantic: {
    success: {
      light: '#D1FAE5',
      main: '#10B981',
      dark: '#059669',
      border: '#6EE7B7',
    },
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
      border: '#FCD34D',
    },
    error: {
      light: '#FEE2E2',
      main: '#EF4444',
      dark: '#DC2626',
      border: '#FCA5A5',
    },
    info: {
      light: '#DBEAFE',
      main: '#3B82F6',
      dark: '#2563EB',
      border: '#93BBFC',
    },
  },
  
  // Repair Status Colors
  status: {
    new: '#00BCD4',        // Cyan
    inProgress: '#F59E0B', // Amber
    onHold: '#6B7280',     // Gray
    completed: '#10B981',  // Green
    cancelled: '#EF4444',  // Red
  },
  
  // Neutral Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

// Typography
export const typography = {
  fontFamily: {
    sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Geist Mono', 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
  
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    relaxed: '0.025em',
    wide: '0.05em',
    wider: '0.1em',
  },
} as const;

// Spacing Scale (based on 4px base unit)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
  40: '10rem',      // 160px
  48: '12rem',      // 192px
  56: '14rem',      // 224px
  64: '16rem',      // 256px
} as const;

// Breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Media Queries
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// Z-Index Scale
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// Animation
export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    moderate: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Container Max Widths
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Priority Colors
export const priorityColors = {
  urgent: {
    bg: colors.semantic.error.light,
    text: colors.semantic.error.dark,
    border: colors.semantic.error.border,
  },
  high: {
    bg: '#FEE2E2',
    text: '#DC2626',
    border: '#FCA5A5',
  },
  medium: {
    bg: colors.semantic.info.light,
    text: colors.semantic.info.dark,
    border: colors.semantic.info.border,
  },
  low: {
    bg: colors.gray[100],
    text: colors.gray[600],
    border: colors.gray[300],
  },
} as const;

// Status Badge Styles
export const statusBadgeStyles = {
  new: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  in_progress: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  on_hold: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
  },
} as const;

// Utility function to get CSS variable value
export function getCSSVariable(variable: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  return '';
}

// Utility function to set CSS variable
export function setCSSVariable(variable: string, value: string): void {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(variable, value);
  }
}

// Export all tokens as a single object
export const tokens = {
  colors,
  typography,
  spacing,
  breakpoints,
  mediaQueries,
  borderRadius,
  shadows,
  zIndex,
  animation,
  containers,
  priorityColors,
  statusBadgeStyles,
} as const;

// Type exports
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Breakpoints = typeof breakpoints;
export type Tokens = typeof tokens;