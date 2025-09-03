import { NextRequest, NextResponse } from 'next/server';
import { TimeEntryRepository } from '@/lib/repositories/time-entry.repository';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    const entryId = resolvedParams.id;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check if user is admin
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete time entries' },
        { status: 403 }
      );
    }

    // Use service role to bypass RLS
    const timeEntryRepo = new TimeEntryRepository(true);
    const ticketRepo = new RepairTicketRepository(true);
    
    // Get the time entry first to get the ticket ID
    const timeEntry = await timeEntryRepo.findById(entryId);
    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

    // Delete the time entry
    const success = await timeEntryRepo.delete(entryId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete time entry' },
        { status: 500 }
      );
    }

    // Recalculate ticket total time after deletion
    const remainingEntries = await timeEntryRepo.findByTicket(timeEntry.ticket_id);
    const totalMinutes = remainingEntries.reduce(
      (sum, entry) => sum + (entry.duration_minutes || 0),
      0
    );

    // Update ticket with new total time
    await ticketRepo.update(timeEntry.ticket_id, {
      total_time_minutes: totalMinutes
    });

    return successResponse(
      { id: entryId },
      'Time entry deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}