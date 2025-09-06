import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { TicketTransformer, RepairTicketWithRelations } from '@/lib/transformers/ticket.transformer';
import { requireAuth, handleApiError } from '@/lib/auth/helpers';

/**
 * Optimized endpoint for real-time ticket updates
 * Returns only essential fields needed for cache updates
 * Uses transformer for consistent data format
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Basic authentication check - real-time updates need auth
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Await params in Next.js 15
    const resolvedParams = await params;
    const ticketId = resolvedParams.id;
    
    // Get repository with service role for full data access
    // This is safe because we're in a server-side API route
    const ticketRepo = getRepository.tickets(true);
    
    // Get ticket with essential relations for Order transformation
    const ticket = await ticketRepo.getTicketWithDetails(ticketId) as RepairTicketWithRelations;

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Transform to Order format using centralized transformer
    const order = TicketTransformer.toOrder(ticket);

    // Return optimized response for real-time updates
    // Smaller payload, faster transmission
    return NextResponse.json(order, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Type': 'realtime-optimized'
      }
    });
  } catch (error) {
    console.error('[Realtime API] Error fetching ticket:', error);
    return handleApiError(error);
  }
}