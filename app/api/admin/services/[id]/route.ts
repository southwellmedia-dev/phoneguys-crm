import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ServiceService } from '@/lib/services/service.service';
import { getRepository } from '@/lib/repositories/repository-manager';
import { z } from 'zod';

const UpdateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  category: z.enum([
    'screen_repair', 'battery_replacement', 'charging_port', 'water_damage', 
    'diagnostic', 'software_issue', 'camera_repair', 'speaker_repair',
    'button_repair', 'motherboard_repair', 'data_recovery', 'other'
  ]).optional(),
  base_price: z.number().min(0, 'Price must be positive').optional(),
  estimated_duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
  requires_parts: z.boolean().optional(),
  skill_level: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
}).partial();

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRepo = getRepository.users();
  const userData = await userRepo.findByEmail(user.email || '');
  
  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

/**
 * Get a single service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const serviceId = params.id;
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const serviceService = new ServiceService();
    const service = await serviceService.getServiceById(serviceId);
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: service
    });
    
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch service'
    }, { status: 500 });
  }
}

/**
 * Update a service
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const serviceId = params.id;
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateServiceSchema.parse(body);

    const serviceService = new ServiceService();
    const service = await serviceService.updateService(serviceId, validatedData);
    
    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
    
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: (error as any).errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating service:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service'
    }, { status: 500 });
  }
}

/**
 * Delete a service
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const serviceId = params.id;
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const serviceService = new ServiceService();
    const success = await serviceService.deleteService(serviceId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting service:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete service'
    }, { status: 500 });
  }
}