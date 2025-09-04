// Database type definitions for The Phone Guys CRM
// These types match the database schema structure

export type UserRole = 'admin' | 'technician' | 'manager';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RepairIssue = 'screen_crack' | 'battery_issue' | 'charging_port' | 'water_damage' | 'software_issue' | 'other';
export type DeviceType = 'smartphone' | 'tablet' | 'laptop' | 'smartwatch' | 'desktop' | 'earbuds' | 'other';
export type PartsAvailability = 'readily_available' | 'available' | 'limited' | 'scarce' | 'discontinued';
export type ServiceCategory = 'screen_repair' | 'battery_replacement' | 'charging_port' | 
  'water_damage' | 'diagnostic' | 'software_issue' | 'camera_repair' | 'speaker_repair' | 
  'button_repair' | 'motherboard_repair' | 'data_recovery' | 'other';
export type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';
export type DeviceCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken';

export interface RepairTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  assigned_to?: string | null;
  device_brand: string;
  device_model: string;
  serial_number?: string | null;
  imei?: string | null;
  repair_issues: RepairIssue[];
  description?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  total_cost?: number | null;
  // labor_cost?: number | null; // This column doesn't exist in the database
  total_time_minutes?: number | null;
  status: TicketStatus;
  priority: Priority;
  date_received: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  created_by?: string | null;
  timer_started_at?: string | null;
  total_timer_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export type NoteType = 'internal' | 'customer';

export interface TicketNote {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  note_type: NoteType;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'new_ticket' | 'status_change' | 'completion' | 'on_hold' | 'custom';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Notification {
  id: string;
  ticket_id: string;
  notification_type: NotificationType;
  recipient_email: string;
  subject: string;
  content: string;
  status: NotificationStatus;
  sent_at?: string | null;
  created_at: string;
}

// DTOs (Data Transfer Objects) for API communication
export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CreateRepairTicketDto {
  customer: CreateCustomerDto | { id: string };
  device: {
    brand: string;
    model: string;
    serial_number?: string;
    imei?: string;
  };
  repair_issues: RepairIssue[];
  description?: string;
  priority?: Priority;
  estimated_cost?: number;
}

export interface UpdateRepairTicketDto {
  assigned_to?: string;
  status?: TicketStatus;
  priority?: Priority;
  repair_issues?: RepairIssue[];
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

export interface CreateTicketNoteDto {
  ticket_id: string;
  note_type: NoteType;
  content: string;
  is_important?: boolean;
}

export interface CreateTimeEntryDto {
  ticket_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
}

export interface UpdateTimeEntryDto {
  end_time: string;
  duration_minutes?: number;
}

export interface CreateNotificationDto {
  ticket_id?: string;
  notification_type: NotificationType;
  recipient_email: string;
  subject: string;
  body?: string;
  content?: string;
  status?: NotificationStatus;
  scheduled_for?: string;
  created_at?: string;
}

// Response types for API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter operators for database queries
export enum FilterOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  LIKE = 'like',
  ILIKE = 'ilike',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

// Filter types for queries
export interface RepairTicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: Priority | Priority[];
  assigned_to?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface CustomerFilters {
  search?: string;
  email?: string;
  phone?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Additional DTOs for services
export interface CreateCustomerDto extends Partial<Customer> {
  name: string;
  email: string;
}

export interface UpdateCustomerDto extends Partial<Customer> {}

export interface UpdateRepairTicketDto extends Partial<RepairTicket> {}

// Admin feature types
export interface Manufacturer {
  id: string;
  name: string;
  logo_url?: string | null;
  country?: string | null;
  is_active: boolean;
  total_repairs_count: number;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  manufacturer_id?: string | null;
  model_name: string;
  model_number?: string | null;
  device_type?: DeviceType | null;
  release_year?: number | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  description?: string | null;
  specifications?: Record<string, any>;
  screen_size?: string | null;
  storage_options?: string[];
  color_options?: string[];
  common_issues?: string[];
  average_repair_cost?: number | null;
  average_repair_time_hours?: number | null;
  parts_availability?: PartsAvailability | null;
  is_active: boolean;
  total_repairs_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations (when joined)
  manufacturer?: Manufacturer;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  category?: ServiceCategory | null;
  base_price?: number | null;
  estimated_duration_minutes?: number | null;
  requires_parts: boolean;
  skill_level?: SkillLevel | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerDevice {
  id: string;
  customer_id: string;
  device_id?: string | null;
  serial_number?: string | null;
  imei?: string | null;
  color?: string | null;
  storage_size?: string | null;
  nickname?: string | null;
  purchase_date?: string | null;
  warranty_expires?: string | null;
  condition?: DeviceCondition | null;
  previous_repairs?: any[];
  notes?: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations (when joined)
  customer?: Customer;
  device?: Device;
}

export interface DeviceService {
  device_id: string;
  service_id: string;
  typical_price?: number | null;
  typical_duration_minutes?: number | null;
  notes?: string | null;
  is_available: boolean;
  created_at: string;
  
  // Relations (when joined)
  device?: Device;
  service?: Service;
}

export interface TicketService {
  id: string;
  ticket_id: string;
  service_id: string;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  technician_notes?: string | null;
  performed_by?: string | null;
  performed_at?: string | null;
  created_at: string;
  
  // Relations (when joined)
  ticket?: RepairTicket;
  service?: Service;
  technician?: User;
}