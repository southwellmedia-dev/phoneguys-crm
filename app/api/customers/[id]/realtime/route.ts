import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { CustomerTransformer } from '@/lib/transformers/customer.transformer';
import { requireAuth, handleApiError } from '@/lib/auth/helpers';

/**
 * Optimized endpoint for real-time customer updates
 * Returns only essential fields needed for cache updates
 */

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Basic authentication check
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Await params in Next.js 15
    const resolvedParams = await params;
    const customerId = resolvedParams.id;
    
    // Get repository with service role for full data access
    const customerRepo = getRepository.customers(true);
    
    // Get customer with essential relations
    const customer = await customerRepo.findById(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get related data for transformation
    const ticketRepo = getRepository.tickets(true);
    const tickets = await ticketRepo.findByCustomer(customerId);
    
    // Transform to list item format using centralized transformer
    const customerWithRelations = {
      ...customer,
      repair_tickets: tickets.map(t => ({
        id: t.id,
        ticket_number: t.ticket_number,
        status: t.status,
        created_at: t.created_at,
      })),
      total_repairs: tickets.length,
    };
    
    const listItem = CustomerTransformer.toListItem(customerWithRelations);

    // Return optimized response
    return NextResponse.json(listItem, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Type': 'realtime-optimized'
      }
    });
  } catch (error) {
    console.error('[Customer Realtime API] Error:', error);
    return handleApiError(error);
  }
}