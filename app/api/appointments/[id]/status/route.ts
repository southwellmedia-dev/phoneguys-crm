import { NextRequest, NextResponse } from 'next/server';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { requireAuth, handleApiError } from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const appointmentId = resolvedParams.id;
    const appointmentRepo = new AppointmentRepository(true);

    // Get the appointment to fetch its current status
    const appointment = await appointmentRepo.findById(appointmentId);
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: appointment.status,
      id: appointment.id,
      updated_at: appointment.updated_at || appointment.created_at
    });
  } catch (error) {
    return handleApiError(error);
  }
}