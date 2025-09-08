/**
 * Hydration Utilities
 * 
 * Helper functions and hooks for managing client-side hydration
 * and progressive enhancement of connected components.
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect if component has been hydrated on client-side
 * Useful for avoiding hydration mismatches and enabling progressive enhancement
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook for progressive data loading with hydration detection
 * Prevents flash of empty state during SSR hydration
 */
export function useProgressiveLoading(enabled: boolean = true) {
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    isMounted,
    isReady: isReady && enabled,
    shouldFetch: isMounted && enabled
  };
}

/**
 * Utility to determine if we should show loading skeleton
 * Based on hydration status and data availability
 */
export function shouldShowSkeleton(
  isLoading: boolean,
  hasData: boolean,
  isMounted: boolean
): boolean {
  // Don't show skeleton during SSR
  if (!isMounted) return false;
  
  // Show skeleton if loading and no data
  return isLoading && !hasData;
}

/**
 * Hook for managing loading states with smooth transitions
 * Prevents rapid loading state changes that cause UI flicker
 */
export function useSmoothedLoading(
  isLoading: boolean, 
  hasData: boolean,
  options: {
    minLoadingTime?: number;
    gracePeriod?: number;
  } = {}
) {
  const { minLoadingTime = 200, gracePeriod = 100 } = options;
  const [showLoading, setShowLoading] = useState(false);
  const isMounted = useIsHydrated();

  useEffect(() => {
    if (!isMounted) return;

    let loadingTimer: NodeJS.Timeout;
    let graceTimer: NodeJS.Timeout;

    if (isLoading && !hasData) {
      // Show loading after grace period
      graceTimer = setTimeout(() => {
        setShowLoading(true);
      }, gracePeriod);
    } else if (showLoading) {
      // Ensure loading is shown for minimum time
      loadingTimer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);
    }

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(graceTimer);
    };
  }, [isLoading, hasData, showLoading, isMounted, minLoadingTime, gracePeriod]);

  return showLoading;
}

/**
 * Creates a stable query key that includes hydration state
 * Prevents unnecessary refetches during hydration
 */
export function createHydratedQueryKey(
  baseKey: (string | number | boolean)[],
  isMounted: boolean
): (string | number | boolean)[] {
  return [...baseKey, 'hydrated', isMounted];
}

/**
 * Utility for handling localStorage with SSR safety
 */
export function getStorageValue<T>(
  key: string,
  defaultValue: T,
  parser?: (value: string) => T
): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return parser ? parser(item) : JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage value for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Utility for setting localStorage with SSR safety
 */
export function setStorageValue<T>(
  key: string,
  value: T,
  serializer?: (value: T) => string
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializedValue = serializer ? serializer(value) : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.warn(`Failed to set localStorage value for key "${key}":`, error);
  }
}

/**
 * Hook for persistent state that survives hydration
 * Automatically saves to localStorage and restores on mount
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: {
    serializer?: (value: T) => string;
    parser?: (value: string) => T;
  } = {}
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const { serializer, parser } = options;
  const [state, setState] = useState<T>(() => 
    getStorageValue(key, defaultValue, parser)
  );

  const setValue = (value: T | ((prevValue: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      setStorageValue(key, valueToStore, serializer);
    } catch (error) {
      console.warn(`Failed to update persisted state for key "${key}":`, error);
    }
  };

  return [state, setValue];
}

/**
 * Higher-order component for progressive enhancement
 * Renders fallback during SSR, then actual component after hydration
 */
export function withProgressive<P extends object>(
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
) {
  return function ProgressiveComponent(props: P) {
    const isHydrated = useIsHydrated();

    if (!isHydrated && Fallback) {
      return <Fallback {...props} />;
    }

    if (!isHydrated) {
      return null;
    }

    return <Component {...props} />;
  };
}