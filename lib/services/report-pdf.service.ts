import { jsPDF } from 'jspdf';
import type { OrderDetail } from '@/lib/types/order-detail.types';

export interface ReportConfig {
  companyName: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyPhone: string;
  companyEmail?: string;
  companyWebsite?: string;
  showTimeEntries: boolean;
  showInternalNotes: boolean;
  pageFormat: 'letter' | 'a4';
  fontSize: {
    title: number;
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  colors: {
    primary: string;
    text: string;
    lightText: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export const defaultReportConfig: ReportConfig = {
  companyName: 'The Phone Guys',
  companyPhone: '(844) 511-0454',
  showTimeEntries: true,
  showInternalNotes: false,
  pageFormat: 'letter',
  fontSize: {
    title: 20,
    heading: 16,
    subheading: 12,
    body: 10,
    small: 8
  },
  colors: {
    primary: '#2563eb',
    text: '#111827',
    lightText: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }
};

export class ReportPDFService {
  private pdf: jsPDF;
  private config: ReportConfig;
  private currentY: number = 20;
  private pageHeight: number = 279; // Letter size height in mm
  private marginBottom: number = 20;
  private marginLeft: number = 20;
  private marginRight: number = 20;
  private pageWidth: number = 216; // Letter size width in mm

  constructor(config: Partial<ReportConfig> = {}) {
    this.config = { ...defaultReportConfig, ...config };
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: this.config.pageFormat
    });
  }

  private formatRepairIssue(issue: string): string {
    // Map common repair issues to human-readable format
    const issueMap: { [key: string]: string } = {
      'screen_crack': 'Cracked Screen',
      'screen_shattered': 'Shattered Screen',
      'battery_drain': 'Battery Drain',
      'water_damage': 'Water Damage',
      'charging_port': 'Charging Port Issue',
      'power_button': 'Power Button Issue',
      'volume_button': 'Volume Button Issue',
      'speaker_issue': 'Speaker Issue',
      'microphone_issue': 'Microphone Issue',
      'camera_issue': 'Camera Issue',
      'wifi_issue': 'WiFi Connection Issue',
      'bluetooth_issue': 'Bluetooth Issue',
      'software_issue': 'Software Issue',
      'other': 'Other Issue'
    };
    
    return issueMap[issue] || issue.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  public generateReport(ticket: OrderDetail): Blob {
    this.currentY = 20;
    
    // Add content
    this.addHeader(ticket);
    this.addCustomerInfo(ticket);
    this.addDeviceInfo(ticket);
    this.addServicesPerformed(ticket);
    
    if (this.config.showTimeEntries && ticket.time_entries?.length > 0) {
      this.addTimeTracking(ticket);
    }
    
    this.addNotes(ticket);
    this.addSignatures();
    this.addFooter();

    return this.pdf.output('blob');
  }

  private checkPageBreak(requiredSpace: number = 30): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.marginBottom) {
      this.pdf.addPage();
      this.currentY = 20;
    }
  }

  private addHeader(ticket: OrderDetail): void {
    // Company name
    this.pdf.setFontSize(this.config.fontSize.title);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(this.config.companyName, this.marginLeft, this.currentY);
    
    // Report title
    this.pdf.setFontSize(this.config.fontSize.heading);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text('SERVICE REPORT', this.pageWidth - this.marginRight, this.currentY, { align: 'right' });
    
    this.currentY += 10;
    
    // Report details box
    const boxX = this.pageWidth - this.marginRight - 70;
    const boxY = this.currentY;
    const boxWidth = 70;
    const boxHeight = 21;
    
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.rect(boxX, boxY, boxWidth, boxHeight);
    
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.text('Ticket #:', boxX + 3, boxY + 6);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(ticket.ticket_number, boxX + boxWidth - 3, boxY + 6, { align: 'right' });
    
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text('Date:', boxX + 3, boxY + 13);
    this.pdf.text(new Date().toLocaleDateString(), boxX + boxWidth - 3, boxY + 13, { align: 'right' });
    
    // Company details
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.lightText);
    let contactY = this.currentY;
    
    if (this.config.companyAddress) {
      this.pdf.text(this.config.companyAddress, this.marginLeft, contactY);
      contactY += 4;
    }
    if (this.config.companyCity) {
      const cityLine = `${this.config.companyCity}${this.config.companyState ? ', ' + this.config.companyState : ''} ${this.config.companyZip || ''}`;
      this.pdf.text(cityLine, this.marginLeft, contactY);
      contactY += 4;
    }
    this.pdf.text(this.config.companyPhone, this.marginLeft, contactY);
    contactY += 4;
    if (this.config.companyEmail) {
      this.pdf.text(this.config.companyEmail, this.marginLeft, contactY);
      contactY += 4;
    }
    if (this.config.companyWebsite) {
      this.pdf.text(this.config.companyWebsite, this.marginLeft, contactY);
    }
    
    this.currentY = boxY + boxHeight + 15;
    
    // Add separator line
    this.pdf.setDrawColor(this.config.colors.border);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    this.currentY += 10;
  }

  private addCustomerInfo(ticket: OrderDetail): void {
    this.checkPageBreak();
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('CUSTOMER INFORMATION', this.marginLeft, this.currentY);
    this.currentY += 8;
    this.pdf.setFont(undefined, 'normal');
    
    // Customer details
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setTextColor(this.config.colors.text);
    
    const customer = ticket.customers;
    const customerName = customer?.name || ticket.customer_name || 'N/A';
    const customerPhone = customer?.phone || ticket.customer_phone || 'N/A';
    const customerEmail = customer?.email || 'N/A';
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Name:', this.marginLeft, this.currentY);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(customerName, this.marginLeft + 25, this.currentY);
    this.currentY += 5;
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Phone:', this.marginLeft, this.currentY);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(customerPhone, this.marginLeft + 25, this.currentY);
    this.currentY += 5;
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Email:', this.marginLeft, this.currentY);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(customerEmail, this.marginLeft + 25, this.currentY);
    this.currentY += 5;
    
    // Status badge
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Status:', this.marginLeft, this.currentY);
    
    const statusColor = ticket.status === 'completed' ? this.config.colors.success :
                       ticket.status === 'in_progress' ? this.config.colors.warning :
                       this.config.colors.primary;
    
    this.pdf.setTextColor(statusColor);
    this.pdf.text(ticket.status.replace('_', ' ').toUpperCase(), this.marginLeft + 25, this.currentY);
    this.pdf.setTextColor(this.config.colors.text);
    
    this.currentY += 10;
  }

  private addDeviceInfo(ticket: OrderDetail): void {
    this.checkPageBreak();
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('DEVICE INFORMATION', this.marginLeft, this.currentY);
    this.currentY += 8;
    this.pdf.setFont(undefined, 'normal');
    
    // Device details
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setTextColor(this.config.colors.text);
    
    const device = ticket.device || ticket.customer_device?.device;
    const deviceName = `${ticket.device_brand || device?.manufacturer?.name || ''} ${ticket.device_model || device?.model_name || ''}`.trim() || 'N/A';
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Device:', this.marginLeft, this.currentY);
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text(deviceName, this.marginLeft + 25, this.currentY);
    this.currentY += 5;
    
    if (ticket.serial_number || ticket.customer_device?.serial_number) {
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('Serial #:', this.marginLeft, this.currentY);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text(ticket.serial_number || ticket.customer_device?.serial_number || '', this.marginLeft + 25, this.currentY);
      this.currentY += 5;
    }
    
    if (ticket.imei || ticket.customer_device?.imei) {
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('IMEI:', this.marginLeft, this.currentY);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text(ticket.imei || ticket.customer_device?.imei || '', this.marginLeft + 25, this.currentY);
      this.currentY += 5;
    }
    
    // Reported issues
    if (ticket.repair_issues?.length > 0) {
      this.currentY += 5;
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('Reported Issues:', this.marginLeft, this.currentY);
      this.currentY += 5;
      
      this.pdf.setFont(undefined, 'normal');
      ticket.repair_issues.forEach((issue: string) => {
        this.pdf.text(`• ${this.formatRepairIssue(issue)}`, this.marginLeft + 5, this.currentY);
        this.currentY += 5;
      });
    }
    
    this.currentY += 5;
  }

  private addServicesPerformed(ticket: OrderDetail): void {
    this.checkPageBreak();
    
    // Debug logging
    console.log('[Report PDF] Adding services, count:', ticket.ticket_services?.length || 0);
    if (ticket.ticket_services && ticket.ticket_services.length > 0) {
      console.log('[Report PDF] First service:', ticket.ticket_services[0]);
    }
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('SERVICES PERFORMED', this.marginLeft, this.currentY);
    this.currentY += 8;
    
    if (!ticket.ticket_services || ticket.ticket_services.length === 0) {
      this.pdf.setFontSize(this.config.fontSize.body);
      this.pdf.setTextColor(this.config.colors.lightText);
      this.pdf.setFont(undefined, 'normal');
      this.pdf.text('No services recorded', this.marginLeft, this.currentY);
      this.currentY += 10;
      return;
    }
    
    // Table header
    const colX = {
      service: this.marginLeft,
      qty: this.pageWidth - 80,
      price: this.pageWidth - 40
    };
    
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(this.config.colors.text);
    
    this.pdf.text('Service', colX.service, this.currentY);
    this.pdf.text('Qty', colX.qty, this.currentY);
    this.pdf.text('Price', colX.price, this.currentY);
    this.currentY += 5;
    
    // Draw line under header
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    this.currentY += 5;
    
    // Table rows
    this.pdf.setFont(undefined, 'normal');
    let total = 0;
    
    ticket.ticket_services.forEach((ts: any) => {
      // Get service name and handle both 'service' and 'services' property names
      const serviceData = ts.service || ts.services;
      const serviceName = serviceData?.name || 'Service';
      
      // Get quantity
      const quantity = ts.quantity || 1;
      
      // Get price - check unit_price first, then fallback to service base_price
      let unitPrice = 0;
      if (ts.unit_price !== undefined && ts.unit_price !== null) {
        unitPrice = typeof ts.unit_price === 'string' ? parseFloat(ts.unit_price) : Number(ts.unit_price);
      } else if (serviceData?.base_price !== undefined && serviceData?.base_price !== null) {
        unitPrice = typeof serviceData.base_price === 'string' ? parseFloat(serviceData.base_price) : Number(serviceData.base_price);
      }
      
      const lineTotal = unitPrice * quantity;
      total += lineTotal;
      
      this.pdf.text(serviceName, colX.service, this.currentY);
      this.pdf.text(quantity.toString(), colX.qty, this.currentY);
      this.pdf.text(`$${lineTotal.toFixed(2)}`, colX.price, this.currentY);
      this.currentY += 5;
    });
    
    // Total line
    this.currentY += 2;
    this.pdf.line(colX.qty - 20, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    this.currentY += 5;
    
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('Total:', colX.qty - 20, this.currentY);
    this.pdf.text(`$${total.toFixed(2)}`, colX.price, this.currentY);
    
    this.currentY += 10;
  }

  private addTimeTracking(ticket: OrderDetail): void {
    if (!ticket.time_entries || ticket.time_entries.length === 0) return;
    
    this.checkPageBreak();
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('TIME TRACKING', this.marginLeft, this.currentY);
    this.currentY += 8;
    this.pdf.setFont(undefined, 'normal');
    
    // Table header
    const colX = {
      date: this.marginLeft,
      tech: this.marginLeft + 30,
      duration: this.marginLeft + 80,
      notes: this.marginLeft + 110
    };
    
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setTextColor(this.config.colors.text);
    
    this.pdf.text('Date', colX.date, this.currentY);
    this.pdf.text('Technician', colX.tech, this.currentY);
    this.pdf.text('Duration', colX.duration, this.currentY);
    this.pdf.text('Notes', colX.notes, this.currentY);
    this.currentY += 5;
    
    // Draw line under header
    this.pdf.setDrawColor(this.config.colors.border);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    this.currentY += 5;
    
    // Table rows
    this.pdf.setFont(undefined, 'normal');
    this.pdf.setFontSize(this.config.fontSize.small);
    
    let totalMinutes = 0;
    ticket.time_entries.forEach((entry: any) => {
      const date = new Date(entry.created_at).toLocaleDateString();
      const techName = entry.user?.full_name || 'Technician';
      const duration = `${entry.duration_minutes} min`;
      const notes = entry.notes || '-';
      
      totalMinutes += entry.duration_minutes;
      
      this.pdf.text(date, colX.date, this.currentY);
      this.pdf.text(techName.substring(0, 15), colX.tech, this.currentY);
      this.pdf.text(duration, colX.duration, this.currentY);
      
      // Handle long notes
      const maxNoteWidth = this.pageWidth - colX.notes - this.marginRight;
      const lines = this.pdf.splitTextToSize(notes, maxNoteWidth);
      this.pdf.text(lines[0], colX.notes, this.currentY);
      
      this.currentY += 5;
    });
    
    // Total time
    this.currentY += 2;
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.text(`Total Time: ${totalMinutes} minutes`, this.marginLeft, this.currentY);
    
    this.currentY += 10;
  }

  private addNotes(ticket: OrderDetail): void {
    const visibleNotes = ticket.notes?.filter((note: any) => 
      this.config.showInternalNotes || note.note_type !== 'internal'
    );
    
    if (!visibleNotes || visibleNotes.length === 0) return;
    
    this.checkPageBreak();
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('SERVICE NOTES', this.marginLeft, this.currentY);
    this.currentY += 8;
    this.pdf.setFont(undefined, 'normal');
    
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setTextColor(this.config.colors.text);
    
    visibleNotes.forEach((note: any) => {
      // Note type
      this.pdf.setFont(undefined, 'bold');
      this.pdf.setTextColor(this.config.colors.warning);
      this.pdf.text(`${note.note_type.toUpperCase()} NOTE`, this.marginLeft, this.currentY);
      this.currentY += 5;
      
      // Note content
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(this.config.colors.text);
      
      const maxWidth = this.pageWidth - this.marginLeft - this.marginRight;
      const lines = this.pdf.splitTextToSize(note.content, maxWidth);
      
      lines.forEach((line: string) => {
        this.pdf.text(line, this.marginLeft, this.currentY);
        this.currentY += 5;
      });
      
      this.currentY += 5;
    });
  }

  private addSignatures(): void {
    this.checkPageBreak(60); // Need space for signature boxes
    
    // Section header
    this.pdf.setFontSize(this.config.fontSize.subheading);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text('SIGNATURES', this.marginLeft, this.currentY);
    this.currentY += 10;
    this.pdf.setFont(undefined, 'normal');
    
    const boxWidth = (this.pageWidth - this.marginLeft - this.marginRight - 10) / 2;
    const leftBoxX = this.marginLeft;
    const rightBoxX = this.marginLeft + boxWidth + 10;
    
    // Customer signature box
    this.pdf.setDrawColor(this.config.colors.border);
    this.pdf.setLineWidth(0.2);
    this.pdf.rect(leftBoxX, this.currentY, boxWidth, 30);
    
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.lightText);
    this.pdf.text('Customer Signature', leftBoxX + 3, this.currentY + 5);
    
    // Signature line
    this.pdf.line(leftBoxX + 5, this.currentY + 20, leftBoxX + boxWidth - 5, this.currentY + 20);
    this.pdf.text(`Date: ${new Date().toLocaleDateString()}`, leftBoxX + 3, this.currentY + 27);
    
    // Technician signature box
    this.pdf.rect(rightBoxX, this.currentY, boxWidth, 30);
    this.pdf.text('Technician Signature', rightBoxX + 3, this.currentY + 5);
    this.pdf.line(rightBoxX + 5, this.currentY + 20, rightBoxX + boxWidth - 5, this.currentY + 20);
    this.pdf.text(`Date: ${new Date().toLocaleDateString()}`, rightBoxX + 3, this.currentY + 27);
    
    this.currentY += 40;
  }

  private addFooter(): void {
    // Position at bottom of page
    const footerY = this.pageHeight - 15;
    
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.lightText);
    
    // Center-aligned footer text
    const footerText1 = `${this.config.companyName} - Professional Device Repair Services`;
    const footerText2 = 'Thank you for choosing us for your repair needs!';
    const footerText3 = 'This is an official service report. Please keep for your records.';
    
    this.pdf.text(footerText1, this.pageWidth / 2, footerY - 6, { align: 'center' });
    this.pdf.text(footerText2, this.pageWidth / 2, footerY - 2, { align: 'center' });
    
    this.pdf.setFontSize(this.config.fontSize.small - 1);
    this.pdf.text(footerText3, this.pageWidth / 2, footerY + 2, { align: 'center' });
  }
}