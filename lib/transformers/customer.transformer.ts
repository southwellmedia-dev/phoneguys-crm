/**
 * Customer Data Transformer
 * 
 * Centralizes all customer-related data transformations to ensure
 * consistency across the application.
 */

import { Customer, CustomerDevice } from '@/lib/types';

// Extended customer type with relationships
export interface CustomerWithRelations extends Customer {
  devices?: CustomerDevice[];
  repair_tickets?: Array<{
    id: string;
    ticket_number: string;
    status: string;
    created_at: string;
  }>;
  appointments?: Array<{
    id: string;
    appointment_number: string;
    appointment_date: string;
    status: string;
  }>;
  total_repairs?: number;
  last_visit?: string;
}

// Display format for customer lists
export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_repairs: number;
  last_visit: string | null;
  created_at: string;
}

/**
 * Transformer class for customer data
 */
export class CustomerTransformer {
  /**
   * Transform customer with relations to list item format
   */
  static toListItem(customer: CustomerWithRelations): CustomerListItem {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      total_repairs: customer.total_repairs || customer.repair_tickets?.length || 0,
      last_visit: customer.last_visit || this.getLastVisit(customer),
      created_at: customer.created_at,
    };
  }

  /**
   * Transform multiple customers to list format
   */
  static toListItems(customers: CustomerWithRelations[]): CustomerListItem[] {
    return customers.map(customer => this.toListItem(customer));
  }

  /**
   * Get customer display name with fallback
   */
  static getDisplayName(customer: Partial<Customer>): string {
    return customer.name || customer.email || 'Unknown Customer';
  }

  /**
   * Get customer contact info formatted
   */
  static getContactInfo(customer: Customer): {
    primary: string;
    secondary: string | null;
  } {
    if (customer.phone) {
      return {
        primary: customer.phone,
        secondary: customer.email,
      };
    }
    return {
      primary: customer.email,
      secondary: null,
    };
  }

  /**
   * Calculate last visit from tickets and appointments
   */
  private static getLastVisit(customer: CustomerWithRelations): string | null {
    const dates: string[] = [];
    
    if (customer.repair_tickets?.length) {
      dates.push(...customer.repair_tickets.map(t => t.created_at));
    }
    
    if (customer.appointments?.length) {
      dates.push(...customer.appointments.map(a => a.appointment_date));
    }
    
    if (dates.length === 0) return null;
    
    // Sort and return the most recent
    return dates.sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )[0];
  }

  /**
   * Format customer for search results
   */
  static toSearchResult(customer: Customer): {
    id: string;
    label: string;
    sublabel: string;
    value: string;
  } {
    return {
      id: customer.id,
      label: customer.name,
      sublabel: customer.email,
      value: customer.id,
    };
  }

  /**
   * Merge customer updates
   */
  static mergeUpdate(existing: Customer, update: Partial<Customer>): Customer {
    return {
      ...existing,
      name: update.name ?? existing.name,
      email: update.email ?? existing.email,
      phone: update.phone ?? existing.phone,
      address: update.address ?? existing.address,
      notes: update.notes ?? existing.notes,
      updated_at: update.updated_at ?? existing.updated_at,
    };
  }

  /**
   * Validate customer data
   */
  static validate(customer: Partial<Customer>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!customer.name?.trim()) {
      errors.push('Customer name is required');
    }
    
    if (!customer.email?.trim()) {
      errors.push('Customer email is required');
    } else if (!this.isValidEmail(customer.email)) {
      errors.push('Invalid email format');
    }
    
    if (customer.phone && !this.isValidPhone(customer.phone)) {
      errors.push('Invalid phone format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Phone validation (basic)
   */
  private static isValidPhone(phone: string): boolean {
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    // Check if it's mostly digits and reasonable length
    return /^\+?\d{7,15}$/.test(cleaned);
  }

  /**
   * Format customer for export
   */
  static toExport(customer: CustomerWithRelations): {
    Name: string;
    Email: string;
    Phone: string;
    Address: string;
    'Total Repairs': number;
    'Last Visit': string;
    'Customer Since': string;
  } {
    return {
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone || '',
      Address: customer.address || '',
      'Total Repairs': customer.total_repairs || 0,
      'Last Visit': customer.last_visit || 'Never',
      'Customer Since': new Date(customer.created_at).toLocaleDateString(),
    };
  }

  /**
   * Sanitize customer data for public API
   */
  static toPublic(customer: Customer): Omit<Customer, 'notes' | 'internal_notes'> {
    const { notes, internal_notes, ...publicData } = customer as any;
    return publicData;
  }
}