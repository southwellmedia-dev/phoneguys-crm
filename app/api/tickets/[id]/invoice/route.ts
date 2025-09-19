import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { InvoicePDFService } from '@/lib/services/invoice-pdf.service';
import { orderDetailToInvoiceData, InvoiceConfig } from '@/lib/types/invoice.types';
import type { OrderDetail } from '@/lib/types/order-detail.types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // Use service-role ticket repo to get full details
      const ticketRepo = new RepairTicketRepository(true);
      const orderDetail = await ticketRepo.getTicketWithDetails(id);
      
      if (!orderDetail) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        );
      }

    // Fetch company settings from database
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    // Parse query parameters for customization
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'download'; // 'download' or 'preview'
    const showTimeEntries = searchParams.get('showTimeEntries') === 'true'; // Default to false for customer invoices
    const taxRate = searchParams.get('taxRate') ? parseFloat(searchParams.get('taxRate')!) : 
                    storeSettings?.tax_rate ? parseFloat(storeSettings.tax_rate) : undefined;

    // Configuration overrides from query params and database
    const configOverrides: Partial<InvoiceConfig> = {
      showTimeEntries,
      ...(storeSettings && {
        companyName: storeSettings.store_name || 'The Phone Guys',
        companyAddress: storeSettings.store_address,
        companyCity: storeSettings.store_city,
        companyState: storeSettings.store_state,
        companyZip: storeSettings.store_zip,
        companyPhone: storeSettings.store_phone || '(844) 511-0454',
        companyEmail: storeSettings.store_email,
        companyWebsite: storeSettings.store_website,
        defaultTaxRate: taxRate || parseFloat(storeSettings.tax_rate || '8.25'),
        currency: storeSettings.currency || 'USD'
      }),
      ...(taxRate !== undefined && { defaultTaxRate: taxRate })
    };

    // Debug logging for services
    console.log('[Invoice API] Ticket ID:', id);
    console.log('[Invoice API] Ticket Number:', orderDetail.ticket_number);
    console.log('[Invoice API] OrderDetail ticket_services count:', orderDetail.ticket_services?.length || 0);
    
    if (orderDetail.ticket_services && orderDetail.ticket_services.length > 0) {
      console.log('[Invoice API] First ticket_service raw data:', {
        id: orderDetail.ticket_services[0].id,
        service_id: orderDetail.ticket_services[0].service_id,
        quantity: orderDetail.ticket_services[0].quantity,
        unit_price: orderDetail.ticket_services[0].unit_price,
        total_price: orderDetail.ticket_services[0].total_price,
        service: orderDetail.ticket_services[0].service
      });
    }
    
    // Convert OrderDetail to InvoiceData
    const invoiceData = orderDetailToInvoiceData(orderDetail, configOverrides);
    
    // Debug converted invoice data
    console.log('[Invoice API] Converted invoice services:', invoiceData.services);
    console.log('[Invoice API] Invoice total:', invoiceData.summary?.total);

    // Generate PDF
    const pdfService = new InvoicePDFService(configOverrides);
    const pdfBlob = pdfService.generateInvoice(invoiceData);

    // Convert blob to buffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', buffer.length.toString());
    
    if (format === 'download') {
      headers.set(
        'Content-Disposition',
        `attachment; filename="invoice-${orderDetail.ticket_number}.pdf"`
      );
    } else {
      headers.set(
        'Content-Disposition',
        `inline; filename="invoice-${orderDetail.ticket_number}.pdf"`
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers
    });

    } catch (innerError) {
      console.error('Error in invoice generation logic:', innerError);
      throw innerError;
    }

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}