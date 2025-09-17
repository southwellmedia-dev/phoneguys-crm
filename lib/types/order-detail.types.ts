import { Database } from './database.types';
import { RepairStatus } from '@/components/orders/status-badge';

// Database row types
type UserRow = Database['public']['Tables']['users']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type RepairTicketRow = Database['public']['Tables']['repair_tickets']['Row'];
type DeviceRow = Database['public']['Tables']['devices']['Row'];
type ManufacturerRow = Database['public']['Tables']['manufacturers']['Row'];
type CustomerDeviceRow = Database['public']['Tables']['customer_devices']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type TicketServiceRow = Database['public']['Tables']['ticket_services']['Row'];
type TicketNoteRow = Database['public']['Tables']['ticket_notes']['Row'];
type TimeEntryRow = Database['public']['Tables']['time_entries']['Row'];
type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

// Extended types with relations
export interface DeviceWithManufacturer extends DeviceRow {
  manufacturer?: ManufacturerRow;
}

export interface CustomerDeviceWithDetails extends CustomerDeviceRow {
  device?: DeviceWithManufacturer;
}

export interface TicketServiceWithDetails extends TicketServiceRow {
  service?: ServiceRow;
}

export interface TicketNoteWithUser extends TicketNoteRow {
  user?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
}

export interface TimeEntryWithUser extends TimeEntryRow {
  user?: Pick<UserRow, 'id' | 'full_name' | 'email' | 'role'>;
}

export interface OrderDetail extends RepairTicketRow {
  // Customer relation
  customers?: CustomerRow;
  
  // Assigned user relation
  assigned_user?: UserRow;
  
  // Device relations
  device?: DeviceWithManufacturer;
  customer_device?: CustomerDeviceWithDetails;
  
  // Service relations
  ticket_services?: TicketServiceWithDetails[];
  
  // Notes and time entries
  notes?: TicketNoteWithUser[];
  time_entries?: TimeEntryWithUser[];
  
  // Appointment relation
  appointment?: AppointmentRow;
  
  // Calculated fields
  total_time_minutes?: number;
  timer_total_minutes?: number;
}

export interface OrderDetailClientProps {
  order: OrderDetail;
  orderId: string;
  totalTimeMinutes: number;
  isAdmin?: boolean;
  currentUserId?: string;
  matchingCustomerDevice?: CustomerDeviceWithDetails;
  appointmentData?: AppointmentWithDetails;
  technicians?: Technician[];
  addDeviceToProfile: (data: AddDeviceData) => Promise<AddDeviceResult>;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AddDeviceData {
  serial_number?: string;
  imei?: string;
  color?: string;
  storage_size?: string;
}

export interface AddDeviceResult {
  success: boolean;
  error?: string;
}

export interface AppointmentWithDetails extends AppointmentRow {
  customers?: CustomerRow;
  device?: DeviceWithManufacturer;
  services?: ServiceRow[];
}

export interface StatusChangeData {
  status: RepairStatus;
  notes?: string;
}

export interface TimeEntryFormData {
  description: string;
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
}

export interface TicketPhotoData {
  id: string;
  url: string;
  caption?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface PrintData {
  ticket: OrderDetail;
  customer: CustomerRow;
  services: TicketServiceWithDetails[];
  timeEntries: TimeEntryWithUser[];
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
  balance: number;
}

export interface OrderTimeline {
  id: string;
  type: 'status_change' | 'note' | 'time_entry' | 'service_added' | 'photo_uploaded';
  timestamp: string;
  description: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
}

// Type guards
export function isOrderDetail(data: unknown): data is OrderDetail {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'ticket_number' in data &&
    'status' in data
  );
}

export function isTimeEntryWithUser(entry: unknown): entry is TimeEntryWithUser {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'id' in entry &&
    'ticket_id' in entry &&
    'duration_minutes' in entry
  );
}

export function isTicketServiceWithDetails(service: unknown): service is TicketServiceWithDetails {
  return (
    typeof service === 'object' &&
    service !== null &&
    'id' in service &&
    'ticket_id' in service &&
    'service_id' in service
  );
}