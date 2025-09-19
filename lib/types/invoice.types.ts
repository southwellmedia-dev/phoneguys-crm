import { OrderDetail } from './order-detail.types';

export interface InvoiceData {
  // Company Information
  company: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  };

  // Invoice Details
  invoice: {
    number: string;
    date: Date;
    dueDate?: Date;
    status: 'paid' | 'unpaid' | 'partial' | 'quote';
    paymentMethod?: string;
  };

  // Customer Information
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };

  // Device Information
  device?: {
    type: string;
    brand?: string;
    model?: string;
    serial?: string;
    imei?: string;
    color?: string;
    storage?: string;
  };

  // Line Items (Services)
  services: InvoiceLineItem[];

  // Time Entries (Optional)
  timeEntries?: InvoiceTimeEntry[];

  // Financial Summary
  summary: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount?: number;
    deposit?: number;
    total: number;
    balance?: number;
  };

  // Additional Information
  notes?: string;
  internalNotes?: string;
  termsAndConditions?: string;
  technicianName?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface InvoiceTimeEntry {
  id: string;
  description: string;
  technician: string;
  durationMinutes: number;
  hourlyRate?: number;
  total?: number;
  date: Date;
}

export interface InvoiceConfig {
  // Company defaults
  companyName: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyTaxId?: string;

  // Financial settings
  defaultTaxRate: number; // As percentage (e.g., 8.25 for 8.25%)
  defaultHourlyRate?: number;
  currency: string;
  currencySymbol: string;

  // Display options
  showTimeEntries: boolean;
  showInternalNotes: boolean;
  showPaymentInstructions: boolean;
  
  // PDF settings
  pageFormat: 'a4' | 'letter';
  fontSize: {
    title: number;
    heading: number;
    body: number;
    small: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    lightText: string;
  };
}

// Default configuration
export const defaultInvoiceConfig: InvoiceConfig = {
  companyName: 'The Phone Guys',
  companyAddress: '123 Repair Street',
  companyCity: 'Houston',
  companyState: 'TX',
  companyZip: '77001',
  companyPhone: '(844) 511-0454',
  companyEmail: 'info@phoneguysrepair.com',
  companyWebsite: 'www.phoneguysrepair.com',
  companyTaxId: '',
  
  defaultTaxRate: 8.25,
  defaultHourlyRate: 75.00,
  currency: 'USD',
  currencySymbol: '$',
  
  showTimeEntries: false, // Don't show time entries to customers
  showInternalNotes: false,
  showPaymentInstructions: true,
  
  pageFormat: 'letter',
  fontSize: {
    title: 24,
    heading: 14,
    body: 10,
    small: 8
  },
  colors: {
    primary: '#0094CA',
    secondary: '#fb2c36',
    text: '#000000',
    lightText: '#666666'
  }
};

// Helper function to transform OrderDetail to InvoiceData
export function orderDetailToInvoiceData(
  order: OrderDetail,
  config: Partial<InvoiceConfig> = {}
): InvoiceData {
  const mergedConfig = { ...defaultInvoiceConfig, ...config };
  
  // Calculate services subtotal (convert string prices to numbers)
  const servicesSubtotal = order.ticket_services?.reduce((sum, service) => {
    const unitPrice = typeof service.unit_price === 'string' ? parseFloat(service.unit_price) : (service.unit_price || 0);
    const totalPrice = typeof service.total_price === 'string' ? parseFloat(service.total_price) : service.total_price;
    const total = totalPrice || (service.quantity || 1) * unitPrice;
    return sum + total;
  }, 0) || 0;

  // Calculate time entries total (if applicable)
  const timeEntriesTotal = mergedConfig.showTimeEntries && order.time_entries
    ? order.time_entries.reduce((sum, entry) => {
        const hours = (entry.duration_minutes || 0) / 60;
        const rate = mergedConfig.defaultHourlyRate || 0;
        return sum + (hours * rate);
      }, 0)
    : 0;

  // Calculate totals
  const subtotal = servicesSubtotal + timeEntriesTotal;
  const taxAmount = (subtotal * mergedConfig.defaultTaxRate) / 100;
  const total = subtotal + taxAmount;
  const deposit = order.deposit_amount || 0;
  const balance = total - deposit;

  return {
    company: {
      name: mergedConfig.companyName,
      address: mergedConfig.companyAddress,
      city: mergedConfig.companyCity,
      state: mergedConfig.companyState,
      zip: mergedConfig.companyZip,
      phone: mergedConfig.companyPhone,
      email: mergedConfig.companyEmail,
      website: mergedConfig.companyWebsite,
      taxId: mergedConfig.companyTaxId
    },
    
    invoice: {
      number: order.ticket_number,
      date: new Date(order.created_at),
      // Only show as paid if actually completed and paid
      status: order.status === 'completed' && order.payment_status === 'paid' ? 'paid' : 
              order.status === 'completed' ? 'unpaid' :
              order.status === 'cancelled' ? 'unpaid' :
              'unpaid',
      paymentMethod: order.payment_method || undefined
    },
    
    customer: {
      name: order.customers?.full_name || order.customer_name || 'Customer',
      email: order.customers?.email || order.customer_email || undefined,
      phone: order.customers?.phone || order.customer_phone || undefined,
      address: order.customers?.address || undefined
    },
    
    device: order.device ? {
      type: order.device.device_type || 'Unknown',
      brand: order.device.manufacturer?.name || undefined,
      model: order.device.model || undefined,
      serial: order.serial_number || undefined,
      imei: order.imei || undefined,
      color: order.customer_device?.color || undefined,
      storage: order.customer_device?.storage_size || undefined
    } : undefined,
    
    services: order.ticket_services?.map(ts => {
      // Handle both service and services property names
      const serviceData = ts.service || ts.services;
      
      // Get price - handle number, string, or fallback to service base_price
      let unitPrice = 0;
      if (ts.unit_price !== undefined && ts.unit_price !== null) {
        unitPrice = typeof ts.unit_price === 'string' ? parseFloat(ts.unit_price) : Number(ts.unit_price);
      } else if (serviceData?.base_price !== undefined && serviceData?.base_price !== null) {
        unitPrice = typeof serviceData.base_price === 'string' ? parseFloat(serviceData.base_price) : Number(serviceData.base_price);
      }
      
      const quantity = ts.quantity || 1;
      
      // Use total_price if available, otherwise calculate
      let total = quantity * unitPrice;
      if (ts.total_price !== undefined && ts.total_price !== null) {
        total = typeof ts.total_price === 'string' ? parseFloat(ts.total_price) : Number(ts.total_price);
      }
      
      console.log('[Invoice Type Conversion] Service:', {
        name: serviceData?.name,
        unitPrice,
        quantity,
        total,
        original_unit_price: ts.unit_price,
        original_total_price: ts.total_price
      });
      
      return {
        id: ts.id,
        description: serviceData?.name || 'Service',
        quantity: quantity,
        unitPrice: unitPrice,
        total: total,
        notes: ts.technician_notes || undefined
      };
    }) || [],
    
    timeEntries: mergedConfig.showTimeEntries && order.time_entries
      ? order.time_entries.map(entry => ({
          id: entry.id,
          description: entry.description || 'Time Entry',
          technician: entry.user?.full_name || 'Unknown',
          durationMinutes: entry.duration_minutes || 0,
          hourlyRate: mergedConfig.defaultHourlyRate,
          total: ((entry.duration_minutes || 0) / 60) * (mergedConfig.defaultHourlyRate || 0),
          date: new Date(entry.start_time || entry.created_at)
        }))
      : undefined,
    
    summary: {
      subtotal,
      taxRate: mergedConfig.defaultTaxRate,
      taxAmount,
      deposit,
      total,
      balance: balance > 0 ? balance : 0
    },
    
    notes: (order as any).issues || undefined,
    internalNotes: mergedConfig.showInternalNotes ? (order as any).internal_notes || undefined : undefined,
    technicianName: order.assigned_user?.full_name || undefined
  };
}

// Format currency helper
export function formatCurrency(amount: number, config: Partial<InvoiceConfig> = {}): string {
  const { currencySymbol = '$' } = { ...defaultInvoiceConfig, ...config };
  return `${currencySymbol}${amount.toFixed(2)}`;
}

// Format date helper
export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}