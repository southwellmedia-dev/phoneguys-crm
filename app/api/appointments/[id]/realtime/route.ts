import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { AppointmentTransformer } from '@/lib/transformers/appointment.transformer';
import { requireAuth, handleApiError } from '@/lib/auth/helpers';

/**
 * Optimized endpoint for real-time appointment updates
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
    const appointmentId = resolvedParams.id;
    
    // Get repository with service role for full data access
    const appointmentRepo = getRepository.appointments(true);
    
    // Get appointment with customer details
    const appointment = await appointmentRepo.findById(appointmentId);

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get customer details if available
    let customerData = null;
    if (appointment.customer_id) {
      const customerRepo = getRepository.customers(true);
      customerData = await customerRepo.findById(appointment.customer_id);
    }

    // Transform to list item format using centralized transformer
    const appointmentWithRelations = {
      ...appointment,
      customers: customerData ? {
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
      } : undefined,
    };
    
    const listItem = AppointmentTransformer.toListItem(appointmentWithRelations);

    // Return optimized response
    return NextResponse.json(listItem, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Type': 'realtime-optimized'
      }
    });
  } catch (error) {
    console.error('[Appointment Realtime API] Error:', error);
    return handleApiError(error);
  }
}