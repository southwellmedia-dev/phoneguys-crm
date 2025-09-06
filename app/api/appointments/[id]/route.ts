import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Fetch appointment with relations
    const appointment = await appointmentRepo.findById(id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return successResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    
    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Check if appointment exists
    const existingAppointment = await appointmentRepo.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prevent reassignment of converted appointments
    if (body.assigned_to !== undefined && existingAppointment.converted_to_ticket_id) {
      return NextResponse.json(
        { error: 'Cannot change assignment for converted appointments' },
        { status: 400 }
      );
    }

    // Prevent reassignment of cancelled appointments
    if (body.assigned_to !== undefined && existingAppointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot change assignment for cancelled appointments' },
        { status: 400 }
      );
    }

    // Prevent reassignment of no-show appointments
    if (body.assigned_to !== undefined && existingAppointment.status === 'no_show') {
      return NextResponse.json(
        { error: 'Cannot change assignment for no-show appointments' },
        { status: 400 }
      );
    }

    // Define allowed fields for update
    const allowedFields = ['assigned_to', 'status', 'notes', 'follow_up_notes'];
    
    // Filter body to only include allowed fields
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    // Update appointment
    const updatedAppointment = await appointmentRepo.update(id, updateData);

    return successResponse(
      updatedAppointment,
      'Appointment updated successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, params: RouteParams) {
  try {
    // Await params in Next.js 15
    const { id } = await params.params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check if user is admin or manager
    if (authResult.role !== 'admin' && !authResult.isManager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get repository instance
    const appointmentRepo = getRepository.appointments();
    
    // Check if appointment exists
    const existingAppointment = await appointmentRepo.findById(id);
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of converted appointments
    if (existingAppointment.converted_to_ticket_id) {
      return NextResponse.json(
        { error: 'Cannot delete converted appointments' },
        { status: 400 }
      );
    }

    // Delete appointment
    await appointmentRepo.delete(id);

    return successResponse(null, 'Appointment deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}