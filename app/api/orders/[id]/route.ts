import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { TicketTransformer } from '@/lib/transformers/ticket.transformer';
import { requireAuth, requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission, AuthorizationService } from '@/lib/services/authorization.service';
import { SecureAPI } from '@/lib/utils/api-helpers';
import { auditLog } from '@/lib/services/audit.service';

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

    // Get customer stats if customer exists
    let customerStats = null;
    if (ticket.customer_id) {
      try {
        // Use the service role client to get counts
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient(true);
        
        // Get repair tickets count
        const { count: repairCount } = await supabase
          .from('repair_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', ticket.customer_id);
        
        // Get appointments count  
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', ticket.customer_id);
        
        customerStats = {
          totalRepairs: repairCount || 0,
          totalAppointments: appointmentCount || 0
        };
      } catch (statsError) {
        console.error('Failed to get customer stats:', statsError);
      }
    }

    return successResponse({
      ...ticket,
      notes,
      customerStats
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PUT = SecureAPI.general(async (request: NextRequest, { params }: RouteParams) => {
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

    // Log the ticket update
    await auditLog.ticketUpdated(
      authResult.userId,
      ticketId,
      {
        ticketNumber: existingTicket.ticket_number,
        changes: body,
        updated_by: authResult.userEmail
      }
    );

    return successResponse(updatedTicket, 'Repair ticket updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = SecureAPI.general(async (request: NextRequest, { params }: RouteParams) => {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and update permission
    const authResult = await requirePermission(request, Permission.TICKET_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const body = await request.json();
    
    // Get repository instance
    const ticketRepo = getRepository.tickets();
    
    // Check if ticket exists
    const existingTicket = await ticketRepo.findById(ticketId);
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Repair ticket not found' },
        { status: 404 }
      );
    }

    // Don't allow assignment changes for completed or cancelled tickets
    if (body.assigned_to !== undefined && 
        (existingTicket.status === 'completed' || existingTicket.status === 'cancelled')) {
      return NextResponse.json(
        { error: 'Cannot change assignment for completed or cancelled tickets' },
        { status: 400 }
      );
    }

    // Check if technician can update this ticket
    if (authResult.role === 'technician' && !authResult.isManager) {
      // Technicians can only update tickets assigned to them
      if (existingTicket.assigned_to !== authResult.userId) {
        return NextResponse.json(
          { error: 'You can only update tickets assigned to you' },
          { status: 403 }
        );
      }
      // Technicians cannot reassign tickets
      if (body.assigned_to !== undefined && body.assigned_to !== authResult.userId) {
        return NextResponse.json(
          { error: 'You do not have permission to reassign tickets' },
          { status: 403 }
        );
      }
    }

    // Only allow specific fields to be updated via PATCH
    const allowedFields = ['assigned_to', 'status', 'priority', 'notes'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update the ticket
    const updatedTicket = await ticketRepo.update(ticketId, updateData);

    // Log specific audit events based on what was updated
    if (updateData.status) {
      await auditLog.ticketStatusChanged(
        authResult.userId,
        ticketId,
        {
          from_status: existingTicket.status,
          to_status: updateData.status,
          ticketNumber: existingTicket.ticket_number,
          customer_id: existingTicket.customer_id
        }
      );
    }

    if (updateData.assigned_to) {
      await auditLog.ticketAssigned(
        authResult.userId,
        ticketId,
        {
          assigned_to: updateData.assigned_to,
          previous_assigned_to: existingTicket.assigned_to,
          ticketNumber: existingTicket.ticket_number,
          assigned_by: authResult.userEmail
        }
      );
    }

    // General update audit log
    if (Object.keys(updateData).length > 0) {
      await auditLog.ticketUpdated(
        authResult.userId,
        ticketId,
        {
          ticketNumber: existingTicket.ticket_number,
          changes: updateData,
          updated_by: authResult.userEmail
        }
      );
    }

    return successResponse(updatedTicket, 'Repair ticket updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = SecureAPI.general(async (request: NextRequest, { params }: RouteParams) => {
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

    // Log the ticket deletion/cancellation
    await auditLog.ticketStatusChanged(
      authResult.userId,
      ticketId,
      {
        from_status: existingTicket.status,
        to_status: 'cancelled',
        ticketNumber: existingTicket.ticket_number,
        customer_id: existingTicket.customer_id,
        cancelled_by: authResult.userEmail
      }
    );

    return successResponse(null, 'Repair ticket cancelled successfully');
  } catch (error) {
    return handleApiError(error);
  }
});