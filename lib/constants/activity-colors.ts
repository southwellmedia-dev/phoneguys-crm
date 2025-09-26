/**
 * Activity Color System
 * Centralized color definitions for all activity types in the CRM
 * Uses the design system tokens for consistency
 */

import { colors } from '@/lib/design/tokens';

/**
 * Activity type color mappings
 * Each activity type has a semantic color that represents its nature
 */
export const ACTIVITY_TYPE_COLORS = {
  // Ticket Events
  ticket_created: 'blue',
  ticket_status_changed: 'purple', // Purple for all status changes
  ticket_assigned: 'purple',
  ticket_completed: 'green',
  
  // Timer Events  
  timer_start: 'orange', // Changed from blue to orange for consistency
  timer_stop: 'orange',
  timer_admin_stop: 'orange',
  
  // Note & Comment Events
  note_created: 'blue',
  comment_created: 'blue',
  comment_reply: 'purple',
  
  // Customer Events
  customer_created: 'green',
  customer_updated: 'blue',
  
  // Appointment Events
  appointment_created: 'purple', // Can be yellow for new requests
  appointment_confirmed: 'green',
  appointment_checked_in: 'blue',
  appointment_status_changed: 'purple', // Purple for all status changes
  appointment_converted: 'green',
  appointment_cancelled: 'red',
  appointment_no_show: 'orange',
  
  // Security Events
  security_login_success: 'green',
  security_login_failure: 'red',
  
  // Default
  default: 'gray'
} as const;

/**
 * Icon mappings for activity types
 */
export const ACTIVITY_TYPE_ICONS = {
  // Ticket Events
  ticket_created: 'package',
  ticket_status_changed: 'refresh',
  ticket_assigned: 'user-check',
  ticket_completed: 'check-circle',
  
  // Timer Events
  timer_start: 'play',
  timer_stop: 'pause',
  timer_admin_stop: 'pause',
  
  // Note & Comment Events
  note_created: 'message-circle',
  comment_created: 'message-circle',
  comment_reply: 'message-circle',
  
  // Customer Events
  customer_created: 'user-plus',
  customer_updated: 'user',
  
  // Appointment Events
  appointment_created: 'calendar',
  appointment_confirmed: 'check-circle',
  appointment_checked_in: 'user-check',
  appointment_status_changed: 'refresh',
  appointment_converted: 'arrow-right',
  appointment_cancelled: 'alert-triangle',
  appointment_no_show: 'alert-triangle',
  
  // Security Events
  security_login_success: 'lock',
  security_login_failure: 'alert-triangle',
  
  // Default
  default: 'activity'
} as const;

/**
 * Color palette for activity system
 * Maps color names to Tailwind classes with light/dark mode support
 */
export const ACTIVITY_COLOR_CLASSES = {
  blue: {
    background: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  green: {
    background: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  yellow: {
    background: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  orange: {
    background: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  purple: {
    background: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  },
  red: {
    background: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  },
  gray: {
    background: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-400',
    icon: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800'
  },
  cyan: {
    background: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    icon: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800'
  }
} as const;

/**
 * Get the color for an activity type
 */
export function getActivityColor(activityType: string): string {
  return ACTIVITY_TYPE_COLORS[activityType as keyof typeof ACTIVITY_TYPE_COLORS] || ACTIVITY_TYPE_COLORS.default;
}

/**
 * Get the icon for an activity type
 */
export function getActivityIcon(activityType: string): string {
  return ACTIVITY_TYPE_ICONS[activityType as keyof typeof ACTIVITY_TYPE_ICONS] || ACTIVITY_TYPE_ICONS.default;
}

/**
 * Get the Tailwind classes for a color
 */
export function getActivityColorClasses(color: string) {
  return ACTIVITY_COLOR_CLASSES[color as keyof typeof ACTIVITY_COLOR_CLASSES] || ACTIVITY_COLOR_CLASSES.gray;
}

/**
 * Get full activity styling
 */
export function getActivityStyling(activityType: string) {
  const color = getActivityColor(activityType);
  const icon = getActivityIcon(activityType);
  const classes = getActivityColorClasses(color);
  
  return {
    color,
    icon,
    classes
  };
}

/**
 * Activity group icon colors for consistency
 * These match the individual activity colors for coherent visual language
 */
export const ACTIVITY_GROUP_ICONS = {
  conversions: {
    icon: 'arrow-right',
    color: ACTIVITY_COLOR_CLASSES.green.icon,
    label: 'Conversions'
  },
  statusChanges: {
    icon: 'refresh',
    color: ACTIVITY_COLOR_CLASSES.purple.icon,
    label: 'Status Changes'
  },
  assignments: {
    icon: 'user-check',
    color: ACTIVITY_COLOR_CLASSES.purple.icon,
    label: 'Assignments'
  },
  notes: {
    icon: 'sticky-note',
    color: ACTIVITY_COLOR_CLASSES.blue.icon,
    label: 'Notes'
  },
  timers: {
    icon: 'timer',
    color: ACTIVITY_COLOR_CLASSES.orange.icon, // Orange for timer activities
    label: 'Timer Actions'
  },
  comments: {
    icon: 'message-circle',
    color: ACTIVITY_COLOR_CLASSES.blue.icon,
    label: 'Comments'
  },
  other: {
    icon: 'clock',
    color: ACTIVITY_COLOR_CLASSES.gray.icon,
    label: 'Other Activities'
  }
} as const;