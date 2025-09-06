import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { TicketTransformer } from '@/lib/transformers/ticket.transformer';
import { requireAuth, requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission, AuthorizationService } from '@/lib/services/authorization.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.TICKET_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    
    // Get repository instance - use service role for full data access
    const ticketRepo = getRepository.tickets(true);
    
    // Try to get ticket with full details first
    let ticket: any = null;
    try {
      ticket = await ticketRepo.getTicketWithDetails(ticketId);
    } catch (detailError) {
      // If detailed fetch fails, try basic fetch
      console.error('Failed to get ticket details:', detailError);
      ticket = await ticketRepo.findById(ticketId);
    }

    if (!ticket) {
      return NextResponse.json(
        { error: 'Repair ticket not found' },
        { status: 404 }
      );
    }

    // Check if technician can view this ticket
    if (authResult.role === 'technician' && !authResult.isManager) {
      const authService = new AuthorizationService();
      const canAccess = await authService.canAccessResource(
        authResult.userId,
        'ticket',
        'view',
        ticket
      );
      
      if (!canAccess) {
        return NextResponse.json(
          { error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
    }

    // Get ticket notes as well
    const noteRepo = getRepository.notes();
    const notes = await noteRepo.findByTicket(ticketId);

    return successResponse({
      ...ticket,
      notes
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and update permission
    const authResult = await requirePermission(request, Permission.TICKET_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const body = await request.json();
    
    // Get repository instance using singleton manager
    const ticketRepo = getRepository.tickets();
    
    // Check if ticket exists
    const existingTicket = await ticketRepo.findById(ticketId);
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Repair ticket not found' },
        { status: 404 }
      );
    }

    // Check if technician can update this ticket
    if (authResult.role === 'technician' && !authResult.isManager) {
      if (existingTicket.assigned_to !== authResult.userId) {
        return NextResponse.json(
          { error: 'You can only update tickets assigned to you' },
          { status: 403 }
        );
      }
    }

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.ticket_number;
    delete body.created_at;
    delete body.created_by;
    delete body.customer_id; // Customer shouldn't be changed after order creation

    // Use the comprehensive update method that handles device and services
    const updatedTicket = await ticketRepo.updateWithDeviceAndServices(
      ticketId,
      body,
      authResult.userId
    );

    return successResponse(updatedTicket, 'Repair ticket updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and delete permission
    const authResult = await requirePermission(request, Permission.TICKET_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    
    // Get repository instance using singleton manager
    const ticketRepo = getRepository.tickets();
    
    // Check if ticket exists
    const existingTicket = await ticketRepo.findById(ticketId);
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Repair ticket not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of completed tickets
    if (existingTicket.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed tickets' },
        { status: 400 }
      );
    }

    // Delete ticket (soft delete by marking as cancelled)
    await ticketRepo.update(ticketId, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: authResult.userId
    });

    return successResponse(null, 'Repair ticket cancelled successfully');
  } catch (error) {
    return handleApiError(error);
  }
}