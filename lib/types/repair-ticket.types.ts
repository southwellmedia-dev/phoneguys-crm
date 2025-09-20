import { Database } from './database.types';

// Base types from database
export type RepairTicketRow = Database['public']['Tables']['repair_tickets']['Row'];
export type CustomerRow = Database['public']['Tables']['customers']['Row'];
export type UserRow = Database['public']['Tables']['users']['Row'];
export type DeviceRow = Database['public']['Tables']['devices']['Row'];
export type ManufacturerRow = Database['public']['Tables']['manufacturers']['Row'];
export type CustomerDeviceRow = Database['public']['Tables']['customer_devices']['Row'];
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type TicketServiceRow = Database['public']['Tables']['ticket_services']['Row'];
export type TicketNoteRow = Database['public']['Tables']['ticket_notes']['Row'];
export type TimeEntryRow = Database['public']['Tables']['time_entries']['Row'];

// Extended types with relations
export interface DeviceWithManufacturer extends DeviceRow {
  manufacturer?: ManufacturerRow;
}

export interface TicketServiceWithService extends TicketServiceRow {
  service?: ServiceRow;
}

export interface TicketNoteWithUser extends TicketNoteRow {
  user?: Pick<UserRow, 'full_name'>;
}

export interface TimeEntryWithUser extends TimeEntryRow {
  user?: UserRow;
}

export interface RepairTicketWithCustomer extends RepairTicketRow {
  customers?: Pick<CustomerRow, 'id' | 'name' | 'email' | 'phone'>;
  assigned_user?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
  device?: DeviceWithManufacturer;
}

export interface RepairTicketWithDetails extends RepairTicketRow {
  customers?: CustomerRow;
  assigned_user?: UserRow;
  device?: DeviceWithManufacturer;
  customer_device?: CustomerDeviceRow;
  ticket_services?: TicketServiceWithService[];
  notes?: TicketNoteWithUser[];
  time_entries?: TimeEntryWithUser[];
}

// Filter and search types
export interface RepairTicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: Priority | Priority[];
  assigned_to?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Status and Priority types
export type TicketStatus = 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// DTOs
export interface CreateRepairTicketDto {
  customer_id: string;
  device_id?: string;
  device_brand?: string;
  device_model?: string;
  serial_number?: string;
  imei?: string;
  repair_issues?: string[];
  description?: string;
  priority?: Priority;
  estimated_cost?: number;
  deposit_amount?: number;
  estimated_completion?: string;
  status?: TicketStatus;
  assigned_to?: string;
  customer_device_id?: string;
}

export interface UpdateRepairTicketDto extends Partial<CreateRepairTicketDto> {
  actual_cost?: number;
  date_completed?: string;
  timer_started_at?: string | null;
  total_timer_minutes?: number;
}

// Statistics types
export interface TicketStatistics {
  total: number;
  by_status: Record<TicketStatus, number>;
  by_priority: Record<Priority, number>;
  avg_completion_time_days: number;
}

export interface StatusCounts {
  new: number;
  in_progress: number;
  on_hold: number;
  completed: number;
  cancelled: number;
  total: number;
}

// Update data with device and services
export interface UpdateWithDeviceAndServicesData {
  // Ticket fields
  device_id?: string;
  serial_number?: string;
  imei?: string;
  repair_issues?: string[];
  description?: string;
  priority?: Priority;
  status?: TicketStatus;
  estimated_cost?: number;
  actual_cost?: number;
  deposit_amount?: number;
  estimated_completion?: string;
  
  // Device fields (for customer_devices table)
  color?: string;
  storage_size?: string;
  condition?: string;
  customer_device_id?: string;
  
  // Services
  selected_services?: string[];
}

// Type guards
export function isRepairTicket(data: unknown): data is RepairTicketRow {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'ticket_number' in data &&
    'status' in data
  );
}

export function isRepairTicketWithDetails(data: unknown): data is RepairTicketWithDetails {
  return isRepairTicket(data);
}

export function isTicketStatus(status: unknown): status is TicketStatus {
  return typeof status === 'string' && 
    ['new', 'in_progress', 'on_hold', 'completed', 'cancelled'].includes(status);
}

export function isPriority(priority: unknown): priority is Priority {
  return typeof priority === 'string' && 
    ['low', 'medium', 'high', 'urgent'].includes(priority);
}