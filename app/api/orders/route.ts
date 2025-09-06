import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { TicketTransformer } from '@/lib/transformers/ticket.transformer';
import { requireAuth, requirePermission, handleApiError, successResponse, paginatedResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

export async function GET(request: NextRequest) {
  try {
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.TICKET_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const customerId = searchParams.get('customerId');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get repository instance using singleton manager
    const ticketRepo = getRepository.tickets();

    // If filtering by assignedTo, use the simple filter approach
    if (assignedTo) {
      console.log('API: Filtering by assignedTo:', assignedTo);
      
      const tickets = await ticketRepo.findByAssignee(assignedTo);
      console.log('API: Found tickets for user:', tickets.length);
      
      // Get customer data for each ticket
      const customerRepo = getRepository.customers();
      const ticketsWithCustomers = await Promise.all(
        tickets.map(async (ticket) => {
          const customer = ticket.customer_id 
            ? await customerRepo.findById(ticket.customer_id)
            : null;
          return {
            ...ticket,
            customers: customer
          };
        })
      );
      
      // Paginate the results manually
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = ticketsWithCustomers.slice(start, end);
      
      return paginatedResponse(
        paginatedData,
        page,
        pageSize,
        ticketsWithCustomers.length
      );
    }

    // For other filters or no filters, use the standard pagination
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (customerId) {
      filters.customer_id = customerId;
    }
    
    // For technicians (non-managers), only show their assigned tickets by default
    if (authResult.role === 'technician' && !authResult.isManager) {
      filters.assigned_to = authResult.userId;
    }

    console.log('API: Final filters:', filters);
    console.log('API: Current user:', authResult.userId, 'Role:', authResult.role);
    
    // Get tickets with pagination
    const result = await ticketRepo.findPaginated(
      Object.keys(filters).length > 0 ? filters : undefined,
      { page, pageSize, sortBy, sortOrder }
    );
    
    console.log('API: Found tickets:', result.data?.length || 0);

    return paginatedResponse(
      result.data,
      result.page,
      result.pageSize,
      result.total
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication and create permission
    const authResult = await requirePermission(request, Permission.TICKET_CREATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    // Validate required fields
    if (!body.customer_id || !body.device_brand || !body.device_model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get repository instance using singleton manager
    const ticketRepo = getRepository.tickets();

    // Extract services array before creating ticket
    const selectedServices = body.selected_services;
    delete body.selected_services;

    // Create new ticket - using device_id instead of device_model_id
    const ticket = await ticketRepo.create({
      customer_id: body.customer_id,
      customer_device_id: body.customer_device_id || null,
      device_id: body.device_id || body.device_model_id || null, // Support both field names for compatibility
      device_brand: body.device_brand,
      device_model: body.device_model,
      serial_number: body.serial_number,
      imei: body.imei,
      repair_issues: body.issue_type || [],
      description: body.issue_description || body.description,
      priority: body.priority || 'medium',
      status: body.status || 'new',
      estimated_cost: body.estimated_cost || 0,
      deposit_amount: body.deposit_amount || 0,
      created_by: authResult.userId, // Track who created the ticket
      assigned_to: body.assigned_to || authResult.userId
    });

    // Add internal notes if provided
    if (body.internal_notes) {
      const noteRepo = getRepository.notes();
      await noteRepo.create({
        ticket_id: ticket.id,
        user_id: authResult.userId,
        note_type: 'internal',
        content: body.internal_notes,
        is_important: false
      });
    }

    // Handle services if provided
    if (selectedServices && selectedServices.length > 0) {
      const { createServiceClient } = await import('@/lib/supabase/service');
      const supabase = createServiceClient();
      
      const ticketServices = selectedServices.map((serviceId: string) => ({
        ticket_id: ticket.id,
        service_id: serviceId,
        quantity: 1,
        performed_by: authResult.userId
      }));
      
      await supabase
        .from('ticket_services')
        .insert(ticketServices);
    }

    return successResponse(ticket, 'Repair ticket created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}