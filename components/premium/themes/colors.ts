/**
 * Premium Color System
 * 
 * @description Comprehensive color palette for The Phone Guys CRM
 * Based on brand colors: Cyan (#0094CA) and Red (#fb2c36)
 */

export const colors = {
  // Brand Colors
  brand: {
    cyan: '#0094CA',
    cyanLight: '#00A8E0',
    cyanDark: '#007FB3',
    red: '#fb2c36',
    redLight: '#FC4E57',
    redDark: '#E91E28',
    navy: '#1A2B3C',
    navyLight: '#2A3F54',
    navyDark: '#0F1A26',
  },

  // Semantic Colors
  semantic: {
    success: {
      base: '#10B981',
      light: '#34D399',
      dark: '#059669',
      soft: '#D1FAE5',
      softer: '#ECFDF5',
    },
    warning: {
      base: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      soft: '#FEF3C7',
      softer: '#FFFBEB',
    },
    error: {
      base: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      soft: '#FEE2E2',
      softer: '#FEF2F2',
    },
    info: {
      base: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      soft: '#DBEAFE',
      softer: '#EFF6FF',
    },
  },

  // Status Colors (for repair states)
  status: {
    new: '#0094CA',        // Cyan
    inProgress: '#F59E0B', // Amber
    onHold: '#6B7280',     // Gray
    completed: '#10B981',  // Green
    cancelled: '#EF4444',  // Red
    pending: '#8B5CF6',    // Purple
  },

  // Neutral Colors
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Glass Effect Colors (with transparency)
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    whiteLight: 'rgba(255, 255, 255, 0.2)',
    whiteDark: 'rgba(255, 255, 255, 0.05)',
    black: 'rgba(0, 0, 0, 0.1)',
    blackLight: 'rgba(0, 0, 0, 0.05)',
    blackDark: 'rgba(0, 0, 0, 0.2)',
    primary: 'rgba(0, 148, 202, 0.1)',
    primaryLight: 'rgba(0, 148, 202, 0.2)',
    primaryDark: 'rgba(0, 148, 202, 0.05)',
  },

  // Gradient Presets
  gradients: {
    primary: 'linear-gradient(135deg, #0094CA 0%, #00A8E0 100%)',
    accent: 'linear-gradient(135deg, #fb2c36 0%, #FC4E57 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    error: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    info: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    dark: 'linear-gradient(135deg, #1A2B3C 0%, #2A3F54 100%)',
    light: 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
    mesh: 'radial-gradient(at 40% 20%, rgba(0, 148, 202, 0.1) 0%, transparent 50%), radial-gradient(at 80% 0%, rgba(251, 44, 54, 0.15) 0%, transparent 50%), radial-gradient(at 10% 50%, rgba(0, 148, 202, 0.1) 0%, transparent 80%)',
  },
};

// Tailwind color class mappings
export const colorClasses = {
  primary: {
    bg: 'bg-primary',
    bgHover: 'hover:bg-primary/90',
    text: 'text-primary',
    textHover: 'hover:text-primary',
    border: 'border-primary',
    ring: 'ring-primary',
  },
  success: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600',
    bgSoft: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    textSoft: 'text-green-700 dark:text-green-300',
    border: 'border-green-500',
    ring: 'ring-green-500',
  },
  warning: {
    bg: 'bg-yellow-500',
    bgHover: 'hover:bg-yellow-600',
    bgSoft: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    textSoft: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-500',
    ring: 'ring-yellow-500',
  },
  error: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    bgSoft: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    textSoft: 'text-red-700 dark:text-red-300',
    border: 'border-red-500',
    ring: 'ring-red-500',
  },
  info: {
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600',
    bgSoft: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    textSoft: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
  },
};