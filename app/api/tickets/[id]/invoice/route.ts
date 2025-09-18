import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRepository } from '@/lib/repositories/repository-manager';
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

    // Fetch complete ticket details
    const ticketRepo = getRepository.tickets();
    const ticket = await ticketRepo.findById(id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Fetch related data to build complete OrderDetail
    const customerRepo = getRepository.customers();
    const deviceRepo = getRepository.devices();
    const userRepo = getRepository.users();
    
    // Build OrderDetail object with all relations
    const orderDetail: OrderDetail = {
      ...ticket,
      customers: ticket.customer_id ? await customerRepo.findById(ticket.customer_id) : undefined,
      device: ticket.device_id ? await deviceRepo.findById(ticket.device_id) : undefined,
      assigned_user: ticket.assigned_to ? await userRepo.findById(ticket.assigned_to) : undefined,
      customer_device: ticket.customer_device_id ? await supabase
        .from('customer_devices')
        .select(`
          *,
          device:devices (
            *,
            manufacturer:manufacturers (*)
          )
        `)
        .eq('id', ticket.customer_device_id)
        .single()
        .then(res => res.data) : undefined,
      ticket_services: await supabase
        .from('ticket_services')
        .select(`
          *,
          service:services (*)
        `)
        .eq('ticket_id', id)
        .then(res => res.data || []),
      time_entries: await supabase
        .from('time_entries')
        .select(`
          *,
          user:users (id, full_name, email, role)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: false })
        .then(res => res.data || []),
      notes: await supabase
        .from('ticket_notes')
        .select(`
          *,
          user:users (id, full_name, email)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: false })
        .then(res => res.data || []),
      appointment: ticket.appointment_id ? await supabase
        .from('appointments')
        .select('*')
        .eq('id', ticket.appointment_id)
        .single()
        .then(res => res.data) : undefined
    };

    // Parse query parameters for customization
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'download'; // 'download' or 'preview'
    const showTimeEntries = searchParams.get('showTimeEntries') !== 'false';
    const taxRate = searchParams.get('taxRate') ? parseFloat(searchParams.get('taxRate')!) : undefined;

    // Configuration overrides from query params
    const configOverrides: Partial<InvoiceConfig> = {
      showTimeEntries,
      ...(taxRate !== undefined && { defaultTaxRate: taxRate })
    };

    // Convert OrderDetail to InvoiceData
    const invoiceData = orderDetailToInvoiceData(orderDetail, configOverrides);

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
        `attachment; filename="invoice-${ticket.ticket_number}.pdf"`
      );
    } else {
      headers.set(
        'Content-Disposition',
        `inline; filename="invoice-${ticket.ticket_number}.pdf"`
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}