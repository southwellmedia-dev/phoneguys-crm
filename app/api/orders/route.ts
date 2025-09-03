import { NextRequest, NextResponse } from 'next/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { TicketNoteRepository } from '@/lib/repositories/ticket-note.repository';
import { requireAuth, requirePermission, handleApiError, successResponse, paginatedResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { FilterOperator } from '@/lib/types/database.types';

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
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Create repository instance
    const ticketRepo = new RepairTicketRepository();

    // Build filters
    const filters: any[] = [];
    
    if (status) {
      filters.push({ field: 'status', operator: FilterOperator.EQ, value: status });
    }
    
    if (priority) {
      filters.push({ field: 'priority', operator: FilterOperator.EQ, value: priority });
    }
    
    if (customerId) {
      filters.push({ field: 'customer_id', operator: FilterOperator.EQ, value: customerId });
    }
    
    if (search) {
      // Search in ticket number, device brand, model
      filters.push({
        or: [
          { field: 'ticket_number', operator: FilterOperator.ILIKE, value: `%${search}%` },
          { field: 'device_brand', operator: FilterOperator.ILIKE, value: `%${search}%` },
          { field: 'device_model', operator: FilterOperator.ILIKE, value: `%${search}%` }
        ]
      });
    }

    // For technicians, only show their assigned tickets
    if (authResult.role === 'technician' && !authResult.isManager) {
      filters.push({ field: 'assigned_to', operator: FilterOperator.EQ, value: authResult.userId });
    }

    // Get tickets with pagination
    const result = await ticketRepo.findAll(
      filters.length > 0 ? { and: filters } : undefined,
      page,
      pageSize
    );

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

    // Create repository instance
    const ticketRepo = new RepairTicketRepository();

    // Create new ticket
    const ticket = await ticketRepo.create({
      customer_id: body.customer_id,
      device_model_id: body.device_model_id || null,
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
      assigned_to: body.assigned_to || authResult.userId
    });

    // Add internal notes if provided
    if (body.internal_notes) {
      const noteRepo = new TicketNoteRepository();
      await noteRepo.create({
        ticket_id: ticket.id,
        user_id: authResult.userId,
        note_type: 'internal',
        content: body.internal_notes,
        is_important: false
      });
    }

    return successResponse(ticket, 'Repair ticket created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}