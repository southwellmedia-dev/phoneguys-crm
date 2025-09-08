/**
 * Connected Premium Components
 * 
 * Data-aware versions of premium UI components that integrate with
 * React Query, Supabase real-time, and the CRM's data layer.
 * 
 * These components follow the principle:
 * - Structure renders immediately (no container skeletons)
 * - Internal skeletons for data loading areas
 * - Real-time updates via cache updates
 * - Progressive enhancement pattern
 */

// Dashboard Components
export { 
  MetricCardLive,
  TotalTicketsCard,
  NewTicketsCard, 
  CompletedTicketsCard,
  TotalCustomersCard,
  RevenueCard,
  type MetricCardLiveProps
} from './dashboard/metric-card-live';

export { 
  RecentActivityLive,
  type RecentActivityLiveProps 
} from './dashboard/recent-activity-live';

// Data Display Components  
export { 
  TablePremiumLive,
  type TablePremiumLiveProps,
  type TableColumn
} from './data-display/table-premium-live';

// Badge Components
export { 
  StatusBadgeLive,
  TicketStatusLive,
  AppointmentStatusLive,
  CustomerStatusLive,
  type StatusBadgeLiveProps
} from './badges/status-badge-live';