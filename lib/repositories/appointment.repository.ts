import { BaseRepository } from './base.repository';

export interface Appointment {
  id: string;
  appointment_number: string;
  customer_id: string | null;
  device_id: string | null;
  customer_device_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  service_ids: string[] | null;
  estimated_cost: number | null;
  status: 'scheduled' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'converted';
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
  arrived_at: string | null;
  converted_to_ticket_id: string | null;
  issues: string[] | null;
  description: string | null;
  urgency: 'walk-in' | 'scheduled' | 'emergency' | null;
  source: 'website' | 'phone' | 'walk-in' | 'email' | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customers?: any;
  devices?: any;
  customer_devices?: any;
  repair_tickets?: any;
  services?: any[];
}

export class AppointmentRepository extends BaseRepository<Appointment> {
  constructor(useServiceRole: boolean = false) {
    super('appointments', useServiceRole);
  }

  /**
   * Find appointments with customer and device information
   */
  async findAllWithDetails() {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        devices (
          id,
          model_name,
          manufacturer:manufacturers (
            name
          )
        ),
        customer_devices (
          id,
          serial_number,
          imei,
          color,
          storage_size
        )
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find today's appointments
   */
  async findTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find upcoming appointments (next 7 days)
   */
  async findUpcomingAppointments() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find appointments by customer
   */
  async findByCustomerId(customerId: string) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        devices (
          id,
          model_name
        )
      `)
      .eq('customer_id', customerId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find appointments by status
   */
  async findByStatus(status: Appointment['status']) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('status', status)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update appointment status
   */
  async updateStatus(id: string, status: Appointment['status'], additionalData?: Partial<Appointment>) {
    const updateData: any = { status, ...additionalData };
    
    // Add timestamp fields based on status
    if (status === 'confirmed' && !additionalData?.confirmation_sent_at) {
      updateData.confirmation_sent_at = new Date().toISOString();
    } else if (status === 'arrived' && !additionalData?.arrived_at) {
      updateData.arrived_at = new Date().toISOString();
    }
    
    return this.update(id, updateData);
  }

  /**
   * Convert appointment to ticket
   */
  async convertToTicket(appointmentId: string, ticketId: string) {
    return this.updateStatus(appointmentId, 'converted', {
      converted_to_ticket_id: ticketId
    });
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, reason: string) {
    return this.updateStatus(id, 'cancelled', {
      cancellation_reason: reason
    });
  }

  /**
   * Find appointment by ID with full details
   */
  async findByIdWithDetails(id: string) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        devices (
          id,
          model_name,
          manufacturer:manufacturers (
            name
          )
        ),
        customer_devices (
          id,
          serial_number,
          imei,
          color,
          storage_size,
          condition,
          nickname,
          devices:device_id (
            id,
            model_name,
            manufacturer:manufacturers(name)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find appointment by number
   */
  async findByAppointmentNumber(appointmentNumber: string) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        devices (
          id,
          model_name,
          manufacturer:manufacturers (
            name
          )
        ),
        customer_devices (
          id,
          serial_number,
          imei,
          color,
          storage_size,
          condition,
          nickname,
          devices:device_id (
            id,
            model_name,
            manufacturer:manufacturers(name)
          )
        )
      `)
      .eq('appointment_number', appointmentNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(scheduledDate: string, scheduledTime: string, durationMinutes: number, excludeId?: string) {
    const supabase = await this.getClient();
    
    // Calculate end time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}:00`;
    
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('scheduled_date', scheduledDate)
      .in('status', ['scheduled', 'confirmed']);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Check for overlapping appointments
    const conflicts = (data || []).filter(apt => {
      const aptStart = apt.scheduled_time;
      const [aptHours, aptMinutes] = aptStart.split(':').map(Number);
      const aptStartMinutes = aptHours * 60 + aptMinutes;
      const aptEndMinutes = aptStartMinutes + (apt.duration_minutes || 30);
      
      // Check if there's an overlap
      return (
        (startMinutes >= aptStartMinutes && startMinutes < aptEndMinutes) ||
        (endMinutes > aptStartMinutes && endMinutes <= aptEndMinutes) ||
        (startMinutes <= aptStartMinutes && endMinutes >= aptEndMinutes)
      );
    });
    
    return conflicts;
  }

  async findRecent(limit: number = 10): Promise<Appointment[]> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent appointments: ${error.message}`);
    }

    return data as Appointment[];
  }
}