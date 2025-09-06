/**
 * Appointment Data Transformer
 * 
 * Centralizes all appointment-related data transformations to ensure
 * consistency across the application.
 */

import { Appointment } from '@/lib/types';

// Extended appointment type with relationships
export interface AppointmentWithRelations extends Appointment {
  customers?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  converted_ticket?: {
    id: string;
    ticket_number: string;
    status: string;
  };
}

// Display format for appointment lists
export interface AppointmentListItem {
  id: string;
  appointment_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  appointment_date: string;
  appointment_time: string;
  device: string;
  issue: string;
  status: string;
  converted_to_ticket_id?: string | null;
}

/**
 * Transformer class for appointment data
 */
export class AppointmentTransformer {
  /**
   * Transform appointment with relations to list item format
   */
  static toListItem(appointment: AppointmentWithRelations): AppointmentListItem {
    return {
      id: appointment.id,
      appointment_number: appointment.appointment_number,
      customer_name: appointment.customers?.name || appointment.customer_name || 'Unknown',
      customer_phone: appointment.customers?.phone || appointment.customer_phone || '',
      customer_email: appointment.customers?.email || appointment.customer_email || '',
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      device: this.formatDevice(appointment),
      issue: appointment.issue_description || 'No description',
      status: appointment.status,
      converted_to_ticket_id: appointment.converted_to_ticket_id,
    };
  }

  /**
   * Transform multiple appointments to list format
   */
  static toListItems(appointments: AppointmentWithRelations[]): AppointmentListItem[] {
    return appointments.map(appointment => this.toListItem(appointment));
  }

  /**
   * Format device information
   */
  private static formatDevice(appointment: Appointment): string {
    if (appointment.device_brand && appointment.device_model) {
      return `${appointment.device_brand} ${appointment.device_model}`;
    }
    return appointment.device_type || 'Unknown Device';
  }

  /**
   * Format appointment date and time for display
   */
  static formatDateTime(appointment: Appointment): string {
    const date = new Date(appointment.appointment_date);
    const dateStr = date.toLocaleDateString();
    return `${dateStr} at ${appointment.appointment_time}`;
  }

  /**
   * Check if appointment is upcoming
   */
  static isUpcoming(appointment: Appointment): boolean {
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    return appointmentDate > now && appointment.status === 'scheduled';
  }

  /**
   * Check if appointment is overdue
   */
  static isOverdue(appointment: Appointment): boolean {
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    return appointmentDate < now && appointment.status === 'scheduled';
  }

  /**
   * Get appointment status color for UI
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: 'blue',
      confirmed: 'green',
      completed: 'gray',
      cancelled: 'red',
      no_show: 'orange',
    };
    return colors[status] || 'gray';
  }

  /**
   * Convert appointment to ticket creation data
   */
  static toTicketData(appointment: AppointmentWithRelations): {
    customer_id: string;
    device_brand: string;
    device_model: string;
    device_type?: string;
    repair_issues: string[];
    description: string;
    priority: string;
    ticket_notes?: string;
    customer_notes?: string;
  } {
    return {
      customer_id: appointment.customer_id,
      device_brand: appointment.device_brand || '',
      device_model: appointment.device_model || '',
      device_type: appointment.device_type,
      repair_issues: this.parseIssues(appointment.issue_description),
      description: appointment.issue_description || '',
      priority: 'medium',
      ticket_notes: appointment.ticket_notes || undefined,
      customer_notes: appointment.customer_notes || undefined,
    };
  }

  /**
   * Parse issue description into repair issues array
   */
  private static parseIssues(description?: string): string[] {
    if (!description) return ['other'];
    
    const issueKeywords = {
      'screen': 'screen_crack',
      'battery': 'battery_issue',
      'charging': 'charging_port',
      'water': 'water_damage',
      'software': 'software_issue',
      'camera': 'camera_repair',
      'speaker': 'speaker_repair',
      'button': 'button_repair',
    };
    
    const desc = description.toLowerCase();
    const issues: string[] = [];
    
    for (const [keyword, issue] of Object.entries(issueKeywords)) {
      if (desc.includes(keyword)) {
        issues.push(issue);
      }
    }
    
    return issues.length > 0 ? issues : ['other'];
  }

  /**
   * Merge appointment updates
   */
  static mergeUpdate(existing: Appointment, update: Partial<Appointment>): Appointment {
    return {
      ...existing,
      ...update,
      updated_at: update.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Format for calendar view
   */
  static toCalendarEvent(appointment: AppointmentWithRelations): {
    id: string;
    title: string;
    start: Date;
    end: Date;
    color: string;
    extendedProps: {
      customer: string;
      device: string;
      issue: string;
      status: string;
    };
  } {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default
    
    return {
      id: appointment.id,
      title: `${appointment.appointment_number} - ${appointment.customers?.name || 'Unknown'}`,
      start: startDate,
      end: endDate,
      color: this.getStatusColor(appointment.status),
      extendedProps: {
        customer: appointment.customers?.name || 'Unknown',
        device: this.formatDevice(appointment),
        issue: appointment.issue_description || '',
        status: appointment.status,
      },
    };
  }

  /**
   * Validate appointment data
   */
  static validate(appointment: Partial<Appointment>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!appointment.customer_id && !appointment.customer_name) {
      errors.push('Customer information is required');
    }
    
    if (!appointment.appointment_date) {
      errors.push('Appointment date is required');
    }
    
    if (!appointment.appointment_time) {
      errors.push('Appointment time is required');
    }
    
    if (!appointment.device_brand && !appointment.device_type) {
      errors.push('Device information is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format for notification
   */
  static toNotification(appointment: AppointmentWithRelations): {
    title: string;
    message: string;
    type: 'reminder' | 'confirmation' | 'cancellation';
  } {
    const customer = appointment.customers?.name || 'Customer';
    const dateTime = this.formatDateTime(appointment);
    
    switch (appointment.status) {
      case 'scheduled':
        return {
          title: 'Appointment Reminder',
          message: `${customer} has an appointment on ${dateTime}`,
          type: 'reminder',
        };
      case 'cancelled':
        return {
          title: 'Appointment Cancelled',
          message: `${customer}'s appointment on ${dateTime} has been cancelled`,
          type: 'cancellation',
        };
      default:
        return {
          title: 'Appointment Update',
          message: `${customer}'s appointment status: ${appointment.status}`,
          type: 'confirmation',
        };
    }
  }
}