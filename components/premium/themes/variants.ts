/**
 * Component Variant Configurations
 * 
 * @description Standardized variant definitions for component consistency
 */

export const variants = {
  // Size variants
  sizes: {
    xs: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      height: 'h-6',
      iconSize: 'w-3 h-3',
    },
    sm: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      height: 'h-8',
      iconSize: 'w-4 h-4',
    },
    md: {
      padding: 'px-4 py-2',
      text: 'text-base',
      height: 'h-10',
      iconSize: 'w-5 h-5',
    },
    lg: {
      padding: 'px-6 py-3',
      text: 'text-lg',
      height: 'h-12',
      iconSize: 'w-6 h-6',
    },
    xl: {
      padding: 'px-8 py-4',
      text: 'text-xl',
      height: 'h-14',
      iconSize: 'w-7 h-7',
    },
  },

  // Rounded variants
  rounded: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  },

  // Shadow variants
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    inner: 'shadow-inner',
    glow: 'shadow-glow',
    glowSm: 'shadow-glow-sm',
    glowLg: 'shadow-glow-lg',
    elevation1: 'shadow-elevation-1',
    elevation2: 'shadow-elevation-2',
    elevation3: 'shadow-elevation-3',
  },

  // Border variants
  borders: {
    none: 'border-0',
    thin: 'border',
    thick: 'border-2',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
    double: 'border-double',
  },

  // Opacity variants
  opacity: {
    0: 'opacity-0',
    10: 'opacity-10',
    20: 'opacity-20',
    30: 'opacity-30',
    40: 'opacity-40',
    50: 'opacity-50',
    60: 'opacity-60',
    70: 'opacity-70',
    80: 'opacity-80',
    90: 'opacity-90',
    100: 'opacity-100',
  },

  // Blur variants
  blur: {
    none: 'backdrop-blur-none',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
    '3xl': 'backdrop-blur-3xl',
  },
};

// Component-specific variant configurations
export const componentVariants = {
  button: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    gradient: 'bg-gradient-primary text-white hover:shadow-lg hover:-translate-y-0.5',
    glass: 'glass text-foreground hover:bg-white/20 dark:hover:bg-white/10',
    glow: 'bg-primary text-primary-foreground shadow-glow hover:shadow-glow-lg',
    soft: 'bg-primary/10 text-primary hover:bg-primary/20',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-green-500 text-white hover:bg-green-600',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
  },

  badge: {
    default: 'bg-primary/10 text-primary border-primary/20',
    solid: 'bg-primary text-primary-foreground',
    gradient: 'bg-gradient-primary text-white',
    outline: 'border border-current bg-transparent',
    soft: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },

  card: {
    default: 'bg-card border shadow-sm',
    elevated: 'bg-card border shadow-elevation-2 hover:shadow-elevation-3',
    glass: 'glass border-white/10',
    gradient: 'bg-gradient-to-br from-card to-card/80',
    interactive: 'bg-card border shadow-sm hover:shadow-lg hover:border-primary/50 cursor-pointer',
    colored: {
      primary: 'bg-primary/5 border-primary/20',
      success: 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800',
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800',
    },
  },

  alert: {
    default: 'bg-background border',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  },
};

// Utility function to get variant classes
export const getVariantClasses = (
  component: keyof typeof componentVariants,
  variant: string
): string => {
  const variants = componentVariants[component];
  if (typeof variants === 'object' && variant in variants) {
    const variantValue = variants[variant as keyof typeof variants];
    return typeof variantValue === 'string' ? variantValue : '';
  }
  return '';
};