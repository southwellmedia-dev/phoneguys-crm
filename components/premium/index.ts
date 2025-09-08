// Premium Design System Components - Main Export File
// Use these components for all new development

// 🔄 CONNECTED COMPONENTS (Real-time data integration)
// USE THESE for all new development - they integrate premium design with live data
export {
  ConnectedMetricCard,
  ConnectedStatCard,
  ConnectedPhoneDetailCard,
  ConnectedActivityTimeline,
  DashboardGrid,
  ConnectedDashboard,
  DashboardExample,
  type MetricType
} from './connected';

// Cards
export { StatCard } from './cards/stat-card';

// Repair Components
export { PhoneDetailCard } from './repair/phone-detail-card';
export { ActivityTimeline } from './repair/activity-timeline';
export { RepairServiceWidget } from './repair/repair-service-widget';

// Data Components
export { PremiumTable, TableActions } from './data/premium-table';

// Navigation Components
export { PremiumTabs, TabPanel } from './navigation/premium-tabs';

// Time Components
export { TimeEntries } from './time/time-entries';

// Widget Components
export { TimerWidget } from './widgets/timer-widget';
export { DeviceSelector } from './widgets/device-selector';
export { RepairServicesSummary } from './widgets/repair-services-summary';
export { CustomerCard } from './widgets/customer-card';
export { PhotosCard } from './widgets/photos-card';
export { NotesWidget } from './widgets/notes-widget';
export { QuickActions } from './widgets/quick-actions';

// Layout Components
export { PageHeader } from './layout/page-header';
export { ModernPageLayout, DetailPageLayout, CompactPageLayout } from './layout/modern-page-layout';

// Re-export types
export type { StatCardProps } from './cards/stat-card';
export type { PhoneDetailCardProps } from './repair/phone-detail-card';
export type { ActivityTimelineProps, TimelineEvent } from './repair/activity-timeline';
export type { RepairServiceWidgetProps, RepairService } from './repair/repair-service-widget';
export type { Column, PremiumTableProps } from './data/premium-table';
export type { Tab, PremiumTabsProps, TabPanelProps } from './navigation/premium-tabs';
export type { TimeEntry, TimeEntriesProps } from './time/time-entries';
export type { TimerState, TimerWidgetProps } from './widgets/timer-widget';
export type { Device, CustomerDevice, DeviceSelectorProps } from './widgets/device-selector';
export type { SummaryRepairService, RepairServicesSummaryProps } from './widgets/repair-services-summary';
export type { Customer, CustomerCardProps } from './widgets/customer-card';
export type { Photo, PhotosCardProps } from './widgets/photos-card';
export type { Note, NotesWidgetProps } from './widgets/notes-widget';
export type { QuickAction, QuickActionsProps } from './widgets/quick-actions';
export type { PageHeaderProps, PageHeaderAction } from './layout/page-header';
export type { ModernPageLayoutProps, DetailPageLayoutProps, CompactPageLayoutProps } from './layout/modern-page-layout';