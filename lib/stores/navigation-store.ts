'use client';

// Simple store to track navigation state
let isNavigating = false;
let navigationTimer: NodeJS.Timeout | null = null;
let listeners: Set<() => void> = new Set();

export const navigationStore = {
  startNavigation() {
    isNavigating = true;
    
    // Clear any existing timer
    if (navigationTimer) {
      clearTimeout(navigationTimer);
    }
    
    // Notify all listeners
    listeners.forEach(listener => listener());
    
    // Reset after delay
    navigationTimer = setTimeout(() => {
      isNavigating = false;
      listeners.forEach(listener => listener());
    }, 600);
  },
  
  getIsNavigating() {
    return isNavigating;
  },
  
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};