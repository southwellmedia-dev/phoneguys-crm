import { AppointmentRepository, Appointment } from '@/lib/repositories/appointment.repository';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { NotificationService } from './notification.service';
import { createServiceClient } from '@/lib/supabase/service';

export interface CreateAppointmentDTO {
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  device?: {
    id?: string;
    brand?: string;
    model?: string;
  };
  customer_device_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  service_ids?: string[];
  estimated_cost?: number;
  issues?: string[];
  description?: string;
  urgency?: 'walk-in' | 'scheduled' | 'emergency';
  source?: 'website' | 'phone' | 'walk-in' | 'email';
  notes?: string;
  assigned_to?: string;
}

export interface UpdateAppointmentDTO {
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  service_ids?: string[];
  estimated_cost?: number;
  issues?: string[];
  description?: string;
  notes?: string;
  assigned_to?: string;
}

export class AppointmentService {
  private appointmentRepo: AppointmentRepository;
  private ticketRepo: RepairTicketRepository;
  private customerRepo: CustomerRepository;
  private notificationService: NotificationService;

  constructor(useServiceRole: boolean = false) {
    this.appointmentRepo = new AppointmentRepository(useServiceRole);
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
    this.customerRepo = new CustomerRepository(useServiceRole);
    this.notificationService = new NotificationService(useServiceRole);
  }

  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    let customerId: string | null = null;

    // Handle customer creation or lookup
    if (data.customer) {
      if (data.customer.id) {
        customerId = data.customer.id;
      } else if (data.customer.email) {
        // Check if customer exists
        const existingCustomer = await this.customerRepo.findByEmail(data.customer.email);
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const newCustomer = await this.customerRepo.create({
            name: data.customer.name!,
            email: data.customer.email,
            phone: data.customer.phone,
          });
          customerId = newCustomer.id;
        }
      }
    }

    // Check for scheduling conflicts
    const conflicts = await this.appointmentRepo.checkConflicts(
      data.scheduled_date,
      data.scheduled_time,
      data.duration_minutes || 30
    );

    if (conflicts.length > 0) {
      throw new Error(`Time slot conflict with appointment ${conflicts[0].appointment_number}`);
    }

    // Create the appointment
    const appointment = await this.appointmentRepo.create({
      customer_id: customerId,
      device_id: data.device?.id || null,
      customer_device_id: data.customer_device_id || null,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes || 30,
      service_ids: data.service_ids || null,
      estimated_cost: data.estimated_cost || null,
      issues: data.issues || null,
      description: data.description || null,
      urgency: data.urgency || 'scheduled',
      source: data.source || 'website',
      notes: data.notes || null,
      assigned_to: data.assigned_to || null,
      status: 'scheduled',
    } as any);

    // Send confirmation email
    if (customerId && data.customer?.email) {
      await this.sendConfirmationEmail(appointment.id, data.customer.email);
    }

    return appointment;
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    // Check for conflicts if rescheduling
    if (data.scheduled_date && data.scheduled_time) {
      const conflicts = await this.appointmentRepo.checkConflicts(
        data.scheduled_date,
        data.scheduled_time,
        data.duration_minutes || 30,
        id
      );

      if (conflicts.length > 0) {
        throw new Error(`Time slot conflict with appointment ${conflicts[0].appointment_number}`);
      }
    }

    return this.appointmentRepo.update(id, data);
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.updateStatus(id, 'confirmed');
    
    // Send confirmation notification
    if (appointment.customer_id) {
      const customer = await this.customerRepo.findById(appointment.customer_id);
      if (customer?.email) {
        await this.sendConfirmationEmail(appointment.id, customer.email);
      }
    }
    
    return appointment;
  }

  /**
   * Mark appointment as arrived
   */
  async markAsArrived(id: string): Promise<Appointment> {
    return this.appointmentRepo.updateStatus(id, 'arrived');
  }

  /**
   * Mark appointment as no-show
   */
  async markAsNoShow(id: string): Promise<Appointment> {
    return this.appointmentRepo.updateStatus(id, 'no_show');
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.cancelAppointment(id, reason);
    
    // Send cancellation notification
    if (appointment.customer_id) {
      const customer = await this.customerRepo.findById(appointment.customer_id);
      if (customer?.email) {
        await this.sendCancellationEmail(appointment.id, customer.email, reason);
      }
    }
    
    return appointment;
  }

  /**
   * Convert appointment to repair ticket
   */
  async convertToTicket(appointmentId: string, additionalData?: any): Promise<{ appointment: Appointment; ticket: any }> {
    // Get appointment details
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'converted') {
      throw new Error('Appointment already converted');
    }

    // Get full appointment details with relations
    const fullAppointment = await this.appointmentRepo.findByAppointmentNumber(appointment.appointment_number);
    
    // Get device details from multiple sources in priority order
    let serialNumber = '';
    let imei = '';
    
    // Priority 1: Additional data from the form (if user edited)
    if (additionalData?.serial_number) {
      serialNumber = additionalData.serial_number;
    }
    if (additionalData?.imei) {
      imei = additionalData.imei;
    }
    
    // Priority 2: Customer device details if linked
    if (!serialNumber || !imei) {
      if (appointment.customer_device_id && fullAppointment?.customer_devices) {
        const customerDevice = fullAppointment.customer_devices;
        serialNumber = serialNumber || customerDevice.serial_number || '';
        imei = imei || customerDevice.imei || '';
      }
    }
    
    // Create repair ticket with all device information
    const ticket = await this.ticketRepo.create({
      customer_id: appointment.customer_id,
      device_id: appointment.device_id,
      customer_device_id: appointment.customer_device_id,
      device_brand: fullAppointment?.devices?.manufacturer?.name || fullAppointment?.customer_devices?.devices?.manufacturer?.name || 'Unknown',
      device_model: fullAppointment?.devices?.model_name || fullAppointment?.customer_devices?.devices?.model_name || 'Unknown',
      serial_number: serialNumber,
      imei: imei,
      repair_issues: appointment.issues || [],
      description: appointment.description || additionalData?.technician_notes || '',
      estimated_cost: additionalData?.estimated_cost || appointment.estimated_cost,
      assigned_to: appointment.assigned_to,
      status: 'new',
      priority: appointment.urgency === 'emergency' ? 'urgent' : 'medium',
    } as any);

    // Add services to the ticket
    const serviceIds = additionalData?.selected_services || appointment.service_ids || [];
    if (serviceIds.length > 0) {
      // Create ticket_services entries for each selected service
      const supabase = createServiceClient();
      
      // Get service details to get prices
      const { data: services } = await supabase
        .from('services')
        .select('id, base_price')
        .in('id', serviceIds);
      
      if (services && services.length > 0) {
        const ticketServices = services.map(service => ({
          ticket_id: ticket.id,
          service_id: service.id,
          quantity: 1,
          unit_price: service.base_price || 0,
        }));
        
        await supabase
          .from('ticket_services')
          .insert(ticketServices);
      }
    }

    // Update appointment as converted
    const updatedAppointment = await this.appointmentRepo.convertToTicket(appointmentId, ticket.id);

    return {
      appointment: updatedAppointment,
      ticket
    };
  }

  /**
   * Get today's appointments
   */
  async getTodaysAppointments(): Promise<Appointment[]> {
    return this.appointmentRepo.findTodayAppointments();
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(): Promise<Appointment[]> {
    return this.appointmentRepo.findUpcomingAppointments();
  }

  /**
   * Get appointments by customer
   */
  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return this.appointmentRepo.findByCustomerId(customerId);
  }

  /**
   * Get appointments by status
   */
  async getAppointmentsByStatus(status: Appointment['status']): Promise<Appointment[]> {
    return this.appointmentRepo.findByStatus(status);
  }

  /**
   * Get all appointments with details
   */
  async getAllAppointments(): Promise<Appointment[]> {
    return this.appointmentRepo.findAllWithDetails();
  }

  /**
   * Send appointment confirmation email
   */
  private async sendConfirmationEmail(appointmentId: string, email: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) return;

    await this.notificationService.createNotification({
      customer_id: appointment.customer_id,
      notification_type: 'appointment_confirmation',
      channel: 'email',
      recipient: email,
      subject: `Appointment Confirmed - ${appointment.appointment_number}`,
      content: `Your appointment is confirmed for ${appointment.scheduled_date} at ${appointment.scheduled_time}.`,
      metadata: {
        appointment_id: appointmentId,
        appointment_number: appointment.appointment_number,
      }
    });

    // Update confirmation sent timestamp
    await this.appointmentRepo.update(appointmentId, {
      confirmation_sent_at: new Date().toISOString()
    } as any);
  }

  /**
   * Send appointment cancellation email
   */
  private async sendCancellationEmail(appointmentId: string, email: string, reason: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) return;

    await this.notificationService.createNotification({
      customer_id: appointment.customer_id,
      notification_type: 'appointment_cancelled',
      channel: 'email',
      recipient: email,
      subject: `Appointment Cancelled - ${appointment.appointment_number}`,
      content: `Your appointment has been cancelled. Reason: ${reason}`,
      metadata: {
        appointment_id: appointmentId,
        appointment_number: appointment.appointment_number,
        cancellation_reason: reason,
      }
    });
  }

  /**
   * Send appointment reminder
   */
  async sendReminder(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepo.findByAppointmentNumber(
      (await this.appointmentRepo.findById(appointmentId))?.appointment_number!
    );
    
    if (!appointment || !appointment.customers?.email) return;

    await this.notificationService.createNotification({
      customer_id: appointment.customer_id,
      notification_type: 'appointment_reminder',
      channel: 'email',
      recipient: appointment.customers.email,
      subject: `Appointment Reminder - Tomorrow at ${appointment.scheduled_time}`,
      content: `This is a reminder about your appointment tomorrow (${appointment.scheduled_date}) at ${appointment.scheduled_time}.`,
      metadata: {
        appointment_id: appointmentId,
        appointment_number: appointment.appointment_number,
      }
    });

    // Update reminder sent timestamp
    await this.appointmentRepo.update(appointmentId, {
      reminder_sent_at: new Date().toISOString()
    } as any);
  }
}