import { Database } from './database.types';
import { Order } from '@/components/orders/orders-columns';
import { Customer } from './customer';
import { Appointment } from './database.types';

// Database table types
export type RepairTicketRow = Database['public']['Tables']['repair_tickets']['Row'];
export type TimeEntryRow = Database['public']['Tables']['time_entries']['Row'];
export type CustomerRow = Database['public']['Tables']['customers']['Row'];
export type CustomerDeviceRow = Database['public']['Tables']['customer_devices']['Row'];
export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type TicketNoteRow = Database['public']['Tables']['ticket_notes']['Row'];
export type InternalNotificationRow = Database['public']['Tables']['internal_notifications']['Row'];

// Realtime payload types
export interface RealtimeTicketPayload {
  new: RepairTicketRow;
  old: RepairTicketRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeTimeEntryPayload {
  new: TimeEntryRow;
  old: TimeEntryRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeCustomerPayload {
  new: CustomerRow;
  old: CustomerRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeCustomerDevicePayload {
  new: CustomerDeviceRow;
  old: CustomerDeviceRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeAppointmentPayload {
  new: AppointmentRow;
  old: AppointmentRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeNotePayload {
  new: TicketNoteRow;
  old: TicketNoteRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export interface RealtimeNotificationPayload {
  new: InternalNotificationRow;
  old: InternalNotificationRow | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

// API Response types
export interface TicketWithRelations extends RepairTicketRow {
  customers?: CustomerRow;
  assigned_user?: Database['public']['Tables']['users']['Row'];
  device?: {
    id: string;
    model_name: string;
    manufacturer?: {
      id: string;
      name: string;
    };
  };
  customer_device?: CustomerDeviceRow;
  notes?: TicketNoteRow[];
  time_entries?: TimeEntryRow[];
}

export interface CustomerWithDevices extends CustomerRow {
  customer_devices?: Array<{
    id: string;
    device?: {
      id: string;
      model_name: string;
      manufacturer?: {
        name: string;
      };
    };
  }>;
  repair_tickets?: RepairTicketRow[];
}

export interface AppointmentWithRelations extends AppointmentRow {
  customers?: CustomerRow;
  device?: {
    id: string;
    model_name: string;
    manufacturer?: {
      name: string;
    };
  };
  services?: Array<{
    id: string;
    name: string;
    category: string;
    base_price: number;
  }>;
}

// Cache update types
export interface CacheUpdateOptions {
  queryKey: unknown[];
  updater: (old: unknown) => unknown;
}

// Fetch promise cache types
export interface FetchCacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

// Dashboard metric types
export interface DashboardMetrics {
  openTickets: number;
  todayAppointments: number;
  completedToday: number;
  totalRevenue: number;
  activeTimers: number;
  pendingPayments: number;
}

// Activity feed types
export interface ActivityItem {
  id: string;
  type: 'ticket' | 'appointment' | 'customer' | 'payment' | 'note';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

// Channel subscription types
export interface ChannelSubscription {
  channel: string;
  status: 'subscribed' | 'unsubscribed' | 'error';
  errorMessage?: string;
}

// Service configuration types
export interface RealtimeServiceConfig {
  fetchCacheTimeout?: number;
  debounceDelay?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Transform result types
export interface TransformedOrder extends Order {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_brand: string;
  device_model: string;
  repair_issues: string[];
  status: string;
  created_at: string;
  updated_at: string;
  timer_total_minutes: number;
  assigned_to?: string;
}

// Error types
export interface RealtimeError {
  code: string;
  message: string;
  details?: unknown;
}

// Export utility type guards
export function isRepairTicketPayload(payload: unknown): payload is RealtimeTicketPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'new' in payload &&
    typeof (payload as any).new === 'object'
  );
}

export function isTimeEntryPayload(payload: unknown): payload is RealtimeTimeEntryPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'new' in payload &&
    typeof (payload as any).new === 'object' &&
    'ticket_id' in (payload as any).new
  );
}

export function isCustomerPayload(payload: unknown): payload is RealtimeCustomerPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'new' in payload &&
    typeof (payload as any).new === 'object' &&
    'email' in (payload as any).new
  );
}

export function isAppointmentPayload(payload: unknown): payload is RealtimeAppointmentPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'new' in payload &&
    typeof (payload as any).new === 'object' &&
    'appointment_date' in (payload as any).new
  );
}