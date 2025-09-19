import { jsPDF } from 'jspdf';
import { 
  InvoiceData, 
  InvoiceConfig, 
  defaultInvoiceConfig,
  formatCurrency,
  formatInvoiceDate 
} from '@/lib/types/invoice.types';

export class InvoicePDFService {
  private pdf: jsPDF;
  private config: InvoiceConfig;
  private currentY: number = 20;
  private pageHeight: number = 279; // Letter size height in mm
  private marginBottom: number = 20;
  private marginLeft: number = 20;
  private marginRight: number = 20;
  private pageWidth: number = 216; // Letter size width in mm

  constructor(config: Partial<InvoiceConfig> = {}) {
    this.config = { ...defaultInvoiceConfig, ...config };
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: this.config.pageFormat
    });
  }

  public generateInvoice(data: InvoiceData): Blob {
    this.currentY = 20;
    
    // Debug - Add a text note about services
    console.log('[PDF Generation] Starting invoice generation');
    console.log('[PDF Generation] Services count:', data.services?.length || 0);
    
    // Add content
    this.addHeader(data); // Header now includes invoice details
    this.addCustomerAndDevice(data);
    
    // Debug - Add visible text to PDF if no services
    if (!data.services || data.services.length === 0) {
      this.pdf.setFontSize(12);
      this.pdf.setTextColor('#FF0000');
      this.pdf.text('DEBUG: No services found in invoice data', this.marginLeft, this.currentY);
      this.currentY += 10;
    }
    
    // Services are the main content - always show them
    this.addServices(data);
    
    // Only add time entries if configured AND they exist (should be false for customer invoices)
    if (this.config.showTimeEntries && data.timeEntries && data.timeEntries.length > 0) {
      this.addTimeEntries(data);
    }
    
    this.addSummary(data);
    this.addFooter(data);

    // Return as blob
    return this.pdf.output('blob');
  }

  public saveInvoice(data: InvoiceData, filename?: string): void {
    this.generateInvoice(data);
    const name = filename || `invoice-${data.invoice.number}.pdf`;
    this.pdf.save(name);
  }

  private addHeader(data: InvoiceData): void {
    const { company } = data;
    
    // Company name - Large and prominent
    this.pdf.setFontSize(this.config.fontSize.title);
    this.pdf.setTextColor(this.config.colors.primary);
    this.pdf.text(company.name, this.marginLeft, this.currentY);
    
    // Invoice title on the right
    this.pdf.setFontSize(this.config.fontSize.heading);
    this.pdf.setTextColor(this.config.colors.text);
    const invoiceText = data.invoice.status === 'quote' ? 'QUOTE' : 'INVOICE';
    this.pdf.text(invoiceText, this.pageWidth - this.marginRight, this.currentY, { align: 'right' });
    
    this.currentY += 10;
    
    // Invoice details box - positioned on the right, under the INVOICE text
    const boxX = this.pageWidth - this.marginRight - 70;
    const boxY = this.currentY;
    const boxWidth = 70;
    const boxHeight = 28;
    
    // Draw box
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.rect(boxX, boxY, boxWidth, boxHeight);
    
    // Add invoice details inside box
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.text('Invoice #:', boxX + 3, boxY + 6);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(data.invoice.number, boxX + boxWidth - 3, boxY + 6, { align: 'right' });
    
    this.pdf.setFont(undefined, 'normal');
    this.pdf.text('Date:', boxX + 3, boxY + 13);
    this.pdf.text(formatInvoiceDate(data.invoice.date), boxX + boxWidth - 3, boxY + 13, { align: 'right' });
    
    if (data.invoice.status) {
      this.pdf.text('Status:', boxX + 3, boxY + 20);
      const statusColor = data.invoice.status === 'paid' ? '#22c55e' : 
                         data.invoice.status === 'partial' ? '#f59e0b' : '#ef4444';
      this.pdf.setTextColor(statusColor);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text(data.invoice.status.toUpperCase(), boxX + boxWidth - 3, boxY + 20, { align: 'right' });
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(this.config.colors.text);
    }
    
    // Company details on the left
    const companyY = boxY;
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.lightText);
    
    let leftY = companyY;
    if (company.address) {
      this.pdf.text(company.address, this.marginLeft, leftY);
      leftY += 4;
    }
    
    if (company.city || company.state || company.zip) {
      const cityStateZip = [company.city, company.state, company.zip]
        .filter(Boolean)
        .join(', ');
      this.pdf.text(cityStateZip, this.marginLeft, leftY);
      leftY += 4;
    }
    
    if (company.phone) {
      this.pdf.text(`Phone: ${company.phone}`, this.marginLeft, leftY);
      leftY += 4;
    }
    
    if (company.email) {
      this.pdf.text(`Email: ${company.email}`, this.marginLeft, leftY);
      leftY += 4;
    }
    
    if (company.website) {
      this.pdf.text(`Web: ${company.website}`, this.marginLeft, leftY);
      leftY += 4;
    }
    
    // Update currentY to the maximum of left content and box
    this.currentY = Math.max(leftY, boxY + boxHeight);
    
    // Add separator line
    this.currentY += 5;
    this.pdf.setDrawColor(this.config.colors.primary);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    this.currentY += 10;
  }

  private addInvoiceDetails(data: InvoiceData): void {
    // This method is no longer needed as invoice details are now in the header
    // Keeping empty method for compatibility
  }

  private addCustomerAndDevice(data: InvoiceData): void {
    const startY = this.currentY;
    
    // Customer section
    this.pdf.setFontSize(this.config.fontSize.heading);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.text('Bill To:', this.marginLeft, this.currentY);
    this.currentY += 6;
    
    this.pdf.setFontSize(this.config.fontSize.body);
    this.pdf.setFont(undefined, 'bold');
    this.pdf.text(data.customer.name, this.marginLeft, this.currentY);
    this.pdf.setFont(undefined, 'normal');
    this.currentY += 4;
    
    this.pdf.setTextColor(this.config.colors.lightText);
    if (data.customer.email) {
      this.pdf.text(data.customer.email, this.marginLeft, this.currentY);
      this.currentY += 4;
    }
    
    if (data.customer.phone) {
      this.pdf.text(data.customer.phone, this.marginLeft, this.currentY);
      this.currentY += 4;
    }
    
    if (data.customer.address) {
      this.pdf.text(data.customer.address, this.marginLeft, this.currentY);
      this.currentY += 4;
      
      const cityStateZip = [data.customer.city, data.customer.state, data.customer.zip]
        .filter(Boolean)
        .join(', ');
      if (cityStateZip) {
        this.pdf.text(cityStateZip, this.marginLeft, this.currentY);
        this.currentY += 4;
      }
    }
    
    // Device section (on the right side)
    if (data.device) {
      let deviceY = startY;
      const deviceX = this.pageWidth / 2;
      
      this.pdf.setFontSize(this.config.fontSize.heading);
      this.pdf.setTextColor(this.config.colors.text);
      this.pdf.text('Device Information:', deviceX, deviceY);
      deviceY += 6;
      
      this.pdf.setFontSize(this.config.fontSize.body);
      this.pdf.setTextColor(this.config.colors.lightText);
      
      if (data.device.brand || data.device.model) {
        const deviceName = [data.device.brand, data.device.model].filter(Boolean).join(' ');
        this.pdf.text(deviceName, deviceX, deviceY);
        deviceY += 4;
      }
      
      if (data.device.type) {
        this.pdf.text(`Type: ${data.device.type}`, deviceX, deviceY);
        deviceY += 4;
      }
      
      if (data.device.serial) {
        this.pdf.text(`Serial: ${data.device.serial}`, deviceX, deviceY);
        deviceY += 4;
      }
      
      if (data.device.imei) {
        this.pdf.text(`IMEI: ${data.device.imei}`, deviceX, deviceY);
        deviceY += 4;
      }
      
      if (data.device.color) {
        this.pdf.text(`Color: ${data.device.color}`, deviceX, deviceY);
        deviceY += 4;
      }
      
      if (data.device.storage) {
        this.pdf.text(`Storage: ${data.device.storage}`, deviceX, deviceY);
        deviceY += 4;
      }
      
      // Update currentY to the max of both columns
      this.currentY = Math.max(this.currentY, deviceY);
    }
    
    this.currentY += 10;
  }

  private addServices(data: InvoiceData): void {
    console.log('[InvoicePDF] Adding services, count:', data.services?.length || 0);
    console.log('[InvoicePDF] Services data:', data.services);
    
    if (!data.services || data.services.length === 0) {
      console.log('[InvoicePDF] No services to add, returning early');
      return;
    }
    
    // Services header
    this.pdf.setFontSize(this.config.fontSize.heading);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.text('Services', this.marginLeft, this.currentY);
    this.currentY += 6;
    
    // Table headers
    const tableStartY = this.currentY;
    const colWidths = {
      description: 90,
      quantity: 20,
      unitPrice: 30,
      total: 30
    };
    
    // Header background
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(this.marginLeft, tableStartY, this.pageWidth - this.marginLeft - this.marginRight, 7, 'F');
    
    // Header text
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.setFont(undefined, 'bold');
    
    let xPos = this.marginLeft;
    this.pdf.text('Description', xPos + 2, tableStartY + 5);
    xPos += colWidths.description;
    this.pdf.text('Qty', xPos + 2, tableStartY + 5);
    xPos += colWidths.quantity;
    this.pdf.text('Unit Price', xPos + 2, tableStartY + 5);
    xPos += colWidths.unitPrice;
    this.pdf.text('Total', xPos + 2, tableStartY + 5);
    
    this.pdf.setFont(undefined, 'normal');
    this.currentY = tableStartY + 8;
    
    // Service rows
    data.services.forEach((service, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.marginBottom - 20) {
        this.addNewPage();
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(this.marginLeft, this.currentY - 1, this.pageWidth - this.marginLeft - this.marginRight, 6, 'F');
      }
      
      this.pdf.setTextColor(this.config.colors.text);
      xPos = this.marginLeft;
      
      // Description (may need to wrap)
      const description = service.description.substring(0, 50) + (service.description.length > 50 ? '...' : '');
      this.pdf.text(description, xPos + 2, this.currentY + 3);
      xPos += colWidths.description;
      
      // Quantity
      this.pdf.text(service.quantity.toString(), xPos + 2, this.currentY + 3);
      xPos += colWidths.quantity;
      
      // Unit Price
      this.pdf.text(formatCurrency(service.unitPrice, this.config), xPos + 2, this.currentY + 3);
      xPos += colWidths.unitPrice;
      
      // Total
      this.pdf.text(formatCurrency(service.total, this.config), xPos + 2, this.currentY + 3);
      
      this.currentY += 6;
      
      // Add notes if present
      if (service.notes) {
        this.pdf.setFontSize(this.config.fontSize.small - 1);
        this.pdf.setTextColor(this.config.colors.lightText);
        this.pdf.text(`   Note: ${service.notes.substring(0, 80)}`, this.marginLeft + 2, this.currentY + 2);
        this.currentY += 4;
        this.pdf.setFontSize(this.config.fontSize.small);
      }
    });
    
    // Table bottom line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    
    this.currentY += 8;
  }

  private addTimeEntries(data: InvoiceData): void {
    if (!data.timeEntries || data.timeEntries.length === 0) return;
    
    // Time entries header
    this.pdf.setFontSize(this.config.fontSize.heading);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.text('Time Entries', this.marginLeft, this.currentY);
    this.currentY += 6;
    
    // Table headers
    const tableStartY = this.currentY;
    const colWidths = {
      date: 25,
      description: 55,
      technician: 30,
      duration: 25,
      rate: 25,
      total: 30
    };
    
    // Header background
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(this.marginLeft, tableStartY, this.pageWidth - this.marginLeft - this.marginRight, 7, 'F');
    
    // Header text
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.setFont(undefined, 'bold');
    
    let xPos = this.marginLeft;
    this.pdf.text('Date', xPos + 2, tableStartY + 5);
    xPos += colWidths.date;
    this.pdf.text('Description', xPos + 2, tableStartY + 5);
    xPos += colWidths.description;
    this.pdf.text('Technician', xPos + 2, tableStartY + 5);
    xPos += colWidths.technician;
    this.pdf.text('Duration', xPos + 2, tableStartY + 5);
    xPos += colWidths.duration;
    this.pdf.text('Rate', xPos + 2, tableStartY + 5);
    xPos += colWidths.rate;
    this.pdf.text('Total', xPos + 2, tableStartY + 5);
    
    this.pdf.setFont(undefined, 'normal');
    this.currentY = tableStartY + 8;
    
    // Time entry rows
    data.timeEntries.forEach((entry, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - this.marginBottom - 20) {
        this.addNewPage();
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(this.marginLeft, this.currentY - 1, this.pageWidth - this.marginLeft - this.marginRight, 6, 'F');
      }
      
      this.pdf.setTextColor(this.config.colors.text);
      xPos = this.marginLeft;
      
      // Date
      const dateStr = entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.pdf.text(dateStr, xPos + 2, this.currentY + 3);
      xPos += colWidths.date;
      
      // Description
      const description = entry.description.substring(0, 30) + (entry.description.length > 30 ? '...' : '');
      this.pdf.text(description, xPos + 2, this.currentY + 3);
      xPos += colWidths.description;
      
      // Technician
      const technician = entry.technician.substring(0, 20);
      this.pdf.text(technician, xPos + 2, this.currentY + 3);
      xPos += colWidths.technician;
      
      // Duration
      const hours = Math.floor(entry.durationMinutes / 60);
      const minutes = entry.durationMinutes % 60;
      const duration = `${hours}h ${minutes}m`;
      this.pdf.text(duration, xPos + 2, this.currentY + 3);
      xPos += colWidths.duration;
      
      // Rate
      if (entry.hourlyRate) {
        this.pdf.text(`${formatCurrency(entry.hourlyRate, this.config)}/hr`, xPos + 2, this.currentY + 3);
      }
      xPos += colWidths.rate;
      
      // Total
      if (entry.total) {
        this.pdf.text(formatCurrency(entry.total, this.config), xPos + 2, this.currentY + 3);
      }
      
      this.currentY += 6;
    });
    
    // Table bottom line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
    
    this.currentY += 8;
  }

  private addSummary(data: InvoiceData): void {
    const summaryX = this.pageWidth - this.marginRight - 70;
    const labelX = summaryX - 30;
    
    this.pdf.setFontSize(this.config.fontSize.body);
    
    // Subtotal
    this.pdf.setTextColor(this.config.colors.text);
    this.pdf.text('Subtotal:', labelX, this.currentY, { align: 'right' });
    this.pdf.text(formatCurrency(data.summary.subtotal, this.config), summaryX + 50, this.currentY, { align: 'right' });
    this.currentY += 5;
    
    // Tax
    if (data.summary.taxAmount > 0) {
      this.pdf.text(`Tax (${data.summary.taxRate}%):`, labelX, this.currentY, { align: 'right' });
      this.pdf.text(formatCurrency(data.summary.taxAmount, this.config), summaryX + 50, this.currentY, { align: 'right' });
      this.currentY += 5;
    }
    
    // Discount
    if (data.summary.discount && data.summary.discount > 0) {
      this.pdf.text('Discount:', labelX, this.currentY, { align: 'right' });
      this.pdf.text(`-${formatCurrency(data.summary.discount, this.config)}`, summaryX + 50, this.currentY, { align: 'right' });
      this.currentY += 5;
    }
    
    // Total line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(labelX - 20, this.currentY, summaryX + 50, this.currentY);
    this.currentY += 2;
    
    // Total
    this.pdf.setFont(undefined, 'bold');
    this.pdf.setFontSize(this.config.fontSize.body + 2);
    this.pdf.text('Total:', labelX, this.currentY + 4, { align: 'right' });
    this.pdf.text(formatCurrency(data.summary.total, this.config), summaryX + 50, this.currentY + 4, { align: 'right' });
    this.currentY += 8;
    
    // Deposit/Payment
    if (data.summary.deposit && data.summary.deposit > 0) {
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setFontSize(this.config.fontSize.body);
      this.pdf.text('Deposit Paid:', labelX, this.currentY, { align: 'right' });
      this.pdf.text(`-${formatCurrency(data.summary.deposit, this.config)}`, summaryX + 50, this.currentY, { align: 'right' });
      this.currentY += 5;
      
      // Balance Due
      if (data.summary.balance && data.summary.balance > 0) {
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.2);
        this.pdf.line(labelX - 20, this.currentY, summaryX + 50, this.currentY);
        this.currentY += 2;
        
        this.pdf.setFont(undefined, 'bold');
        this.pdf.setTextColor(this.config.colors.secondary);
        this.pdf.text('Balance Due:', labelX, this.currentY + 4, { align: 'right' });
        this.pdf.text(formatCurrency(data.summary.balance, this.config), summaryX + 50, this.currentY + 4, { align: 'right' });
        this.currentY += 8;
      }
    }
    
    this.currentY += 10;
  }

  private addFooter(data: InvoiceData): void {
    // Add notes if present
    if (data.notes) {
      this.pdf.setFontSize(this.config.fontSize.body);
      this.pdf.setTextColor(this.config.colors.text);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('Notes:', this.marginLeft, this.currentY);
      this.currentY += 5;
      
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(this.config.colors.lightText);
      const lines = this.pdf.splitTextToSize(data.notes, this.pageWidth - this.marginLeft - this.marginRight);
      lines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - this.marginBottom - 10) {
          this.addNewPage();
        }
        this.pdf.text(line, this.marginLeft, this.currentY);
        this.currentY += 4;
      });
      
      this.currentY += 5;
    }
    
    // Payment instructions (if unpaid)
    if (data.invoice.status !== 'paid' && this.config.showPaymentInstructions) {
      if (this.currentY > this.pageHeight - this.marginBottom - 30) {
        this.addNewPage();
      }
      
      this.pdf.setFontSize(this.config.fontSize.body);
      this.pdf.setTextColor(this.config.colors.text);
      this.pdf.setFont(undefined, 'bold');
      this.pdf.text('Payment Instructions:', this.marginLeft, this.currentY);
      this.currentY += 5;
      
      this.pdf.setFont(undefined, 'normal');
      this.pdf.setTextColor(this.config.colors.lightText);
      this.pdf.text('• Cash, Check, or Credit Card accepted', this.marginLeft + 5, this.currentY);
      this.currentY += 4;
      this.pdf.text('• Payment due upon completion of service', this.marginLeft + 5, this.currentY);
      this.currentY += 4;
      this.pdf.text(`• Please reference invoice #${data.invoice.number} with payment`, this.marginLeft + 5, this.currentY);
      this.currentY += 8;
    }
    
    // Terms and conditions
    if (data.termsAndConditions) {
      this.pdf.setFontSize(this.config.fontSize.small);
      this.pdf.setTextColor(this.config.colors.lightText);
      const lines = this.pdf.splitTextToSize(data.termsAndConditions, this.pageWidth - this.marginLeft - this.marginRight);
      lines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - this.marginBottom - 5) {
          this.addNewPage();
        }
        this.pdf.text(line, this.marginLeft, this.currentY);
        this.currentY += 3;
      });
    }
    
    // Footer line and text
    const footerY = this.pageHeight - this.marginBottom;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(this.marginLeft, footerY - 5, this.pageWidth - this.marginRight, footerY - 5);
    
    this.pdf.setFontSize(this.config.fontSize.small);
    this.pdf.setTextColor(this.config.colors.lightText);
    this.pdf.text('Thank you for your business!', this.pageWidth / 2, footerY, { align: 'center' });
    
    // Page numbers if multiple pages
    const pageCount = this.pdf.getNumberOfPages();
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        this.pdf.setPage(i);
        this.pdf.setFontSize(this.config.fontSize.small);
        this.pdf.setTextColor(this.config.colors.lightText);
        this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.marginRight, footerY, { align: 'right' });
      }
    }
  }

  private addNewPage(): void {
    this.pdf.addPage();
    this.currentY = this.marginLeft;
  }
}