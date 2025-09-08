/**
 * Centralized Pill/Badge Utility System
 * 
 * @description Provides consistent styling and formatting for pills/badges across the application
 * @category Premium Utils
 */

export type PillType = 'issue' | 'service' | 'category' | 'tag' | 'count' | 'default';
export type PillVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface PillConfig {
  className: string;
  variant: PillVariant;
}

/**
 * Base pill classes - consistent across the system
 */
export const PILL_BASE_CLASSES = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";

/**
 * Pill variant color mappings
 */
const PILL_VARIANTS: Record<PillVariant, string> = {
  primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  secondary: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

/**
 * Issue categorization for repair tickets
 */
export function getIssuePillConfig(issue: string): PillConfig {
  const lowerIssue = issue.toLowerCase();
  
  // Critical issues - red
  if (lowerIssue.includes('broken') || lowerIssue.includes('cracked') || lowerIssue.includes('damaged') || lowerIssue.includes('dead')) {
    return { className: PILL_VARIANTS.error, variant: 'error' };
  }
  
  // Battery/power issues - orange
  if (lowerIssue.includes('battery') || lowerIssue.includes('charging') || lowerIssue.includes('power')) {
    return { className: PILL_VARIANTS.warning, variant: 'warning' };
  }
  
  // Software issues - purple/info
  if (lowerIssue.includes('software') || lowerIssue.includes('app') || lowerIssue.includes('system') || lowerIssue.includes('update')) {
    return { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', variant: 'info' };
  }
  
  // Network/connectivity issues - blue
  if (lowerIssue.includes('network') || lowerIssue.includes('wifi') || lowerIssue.includes('bluetooth') || lowerIssue.includes('signal')) {
    return { className: PILL_VARIANTS.info, variant: 'info' };
  }
  
  // Audio/speaker issues - green
  if (lowerIssue.includes('speaker') || lowerIssue.includes('microphone') || lowerIssue.includes('audio') || lowerIssue.includes('sound')) {
    return { className: PILL_VARIANTS.success, variant: 'success' };
  }
  
  // Default - secondary/cyan
  return { className: PILL_VARIANTS.secondary, variant: 'secondary' };
}

/**
 * Service categorization
 */
export function getServicePillConfig(service: string | { name: string; category?: string }): PillConfig {
  if (typeof service === 'object' && service.category) {
    const category = service.category.toLowerCase();
    
    switch (category) {
      case 'screen_repair':
      case 'display':
        return { className: PILL_VARIANTS.error, variant: 'error' };
      case 'battery_replacement':
      case 'power':
        return { className: PILL_VARIANTS.warning, variant: 'warning' };
      case 'software_repair':
      case 'software':
        return { className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', variant: 'info' };
      case 'data_recovery':
      case 'backup':
        return { className: PILL_VARIANTS.info, variant: 'info' };
      case 'cleaning':
      case 'maintenance':
        return { className: PILL_VARIANTS.success, variant: 'success' };
      default:
        return { className: PILL_VARIANTS.primary, variant: 'primary' };
    }
  }
  
  // Default for services
  return { className: PILL_VARIANTS.primary, variant: 'primary' };
}

/**
 * General pill configuration by type
 */
export function getPillConfig(type: PillType, value: string): PillConfig {
  switch (type) {
    case 'issue':
      return getIssuePillConfig(value);
    case 'service':
      return getServicePillConfig(value);
    case 'category':
      return { className: PILL_VARIANTS.info, variant: 'info' };
    case 'tag':
      return { className: PILL_VARIANTS.secondary, variant: 'secondary' };
    case 'count':
      return { className: 'border border-border', variant: 'neutral' };
    default:
      return { className: PILL_VARIANTS.neutral, variant: 'neutral' };
  }
}

/**
 * Format text for pill display
 */
export function formatPillText(text: string): string {
  return text
    .replace(/_/g, ' ')                    // Replace underscores with spaces
    .toLowerCase()                         // Lowercase first
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case each word
    .trim();
}

/**
 * Complete pill class string
 */
export function getPillClasses(type: PillType, value: string): string {
  const config = getPillConfig(type, value);
  return `${PILL_BASE_CLASSES} ${config.className}`;
}

/**
 * Count pill (for "+3 more" style)
 */
export function getCountPillClasses(): string {
  return `${PILL_BASE_CLASSES} border border-border text-muted-foreground`;
}