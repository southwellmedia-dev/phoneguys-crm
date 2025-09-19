import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { ReportPDFService, ReportConfig } from '@/lib/services/report-pdf.service';
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

    // Use service-role ticket repo to get full details (same as invoice)
    const ticketRepo = new RepairTicketRepository(true);
    const orderDetail = await ticketRepo.getTicketWithDetails(id);
    
    if (!orderDetail) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // Debug logging for services
    console.log('[Report API] Ticket ID:', id);
    console.log('[Report API] Ticket Number:', orderDetail.ticket_number);
    console.log('[Report API] OrderDetail ticket_services count:', orderDetail.ticket_services?.length || 0);
    
    if (orderDetail.ticket_services && orderDetail.ticket_services.length > 0) {
      console.log('[Report API] First ticket_service:', orderDetail.ticket_services[0]);
    }

    // Fetch company settings from database
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    // Parse query parameters for customization
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'download'; // 'download' or 'preview'
    const showTimeEntries = searchParams.get('showTimeEntries') !== 'false'; // Default to true for reports
    const showInternalNotes = searchParams.get('showInternalNotes') === 'true'; // Default to false

    // Configuration overrides from query params and database
    const configOverrides: Partial<ReportConfig> = {
      showTimeEntries,
      showInternalNotes,
      ...(storeSettings && {
        companyName: storeSettings.store_name || 'The Phone Guys',
        companyAddress: storeSettings.store_address,
        companyCity: storeSettings.store_city,
        companyState: storeSettings.store_state,
        companyZip: storeSettings.store_zip,
        companyPhone: storeSettings.store_phone || '(844) 511-0454',
        companyEmail: storeSettings.store_email,
        companyWebsite: storeSettings.store_website
      })
    };

    // Generate PDF
    const pdfService = new ReportPDFService(configOverrides);
    const pdfBlob = pdfService.generateReport(orderDetail);

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
        `attachment; filename="report-${orderDetail.ticket_number}.pdf"`
      );
    } else {
      headers.set(
        'Content-Disposition',
        `inline; filename="report-${orderDetail.ticket_number}.pdf"`
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}