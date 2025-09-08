/**
 * Connected Component Hooks
 * 
 * Specialized hooks for data-aware premium components
 */

export { 
  useMetricData, 
  useDashboardMetrics,
  type MetricType,
  type MetricFilters,
  type MetricData
} from './use-metric-data';

export { 
  useActivityFeed,
  type ActivityFilters,
  type ActivityItem
} from './use-activity-feed';

export { 
  useTableData,
  type TableDataOptions,
  type SortConfig
} from './use-table-data';