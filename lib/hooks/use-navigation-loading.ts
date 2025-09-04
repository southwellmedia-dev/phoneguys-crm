'use client';

/**
 * Show skeleton only when actually loading data
 * Since we use SSR with initial data, this will only show during:
 * - Manual refresh (user clicks refresh button)
 * - Data mutations (create/update/delete)
 * - Real-time updates
 */
export function useShowSkeleton(
  isQueryLoading: boolean,
  isFetching: boolean,
  hasData: boolean
) {
  // Only show skeleton if we don't have data AND we're loading
  // With SSR, we always have initial data, so this rarely triggers
  return isQueryLoading && !hasData;
}