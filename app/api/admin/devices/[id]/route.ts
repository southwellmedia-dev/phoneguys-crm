import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeviceRepository } from '@/lib/repositories/device.repository';
import { UserRepository } from '@/lib/repositories/user.repository';
import { z } from 'zod';

const UpdateDeviceSchema = z.object({
  manufacturer_id: z.string().uuid('Invalid manufacturer ID').optional(),
  model_name: z.string().min(1, 'Model name is required').max(200).optional(),
  model_number: z.string().max(100).optional(),
  device_type: z.enum(['smartphone', 'tablet', 'laptop', 'smartwatch', 'desktop', 'earbuds', 'other']).optional(),
  release_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  specifications: z.record(z.string()).optional(),
});

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRepo = new UserRepository();
  const userData = await userRepo.findByEmail(user.email || '');
  
  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

/**
 * Update a device
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const deviceId = params.id;
    
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateDeviceSchema.parse(body);

    // Clean up empty string values
    const cleanedData = {
      ...validatedData,
      model_number: validatedData.model_number || null,
      image_url: validatedData.image_url || null,
      device_type: validatedData.device_type || null,
      release_year: validatedData.release_year || null,
      specifications: validatedData.specifications || {},
    };

    const deviceRepo = new DeviceRepository();
    const device = await deviceRepo.update(deviceId, cleanedData);
    
    return NextResponse.json({
      success: true,
      data: device,
      message: 'Device updated successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating device:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update device'
    }, { status: 500 });
  }
}

/**
 * Delete a device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const deviceId = params.id;
    
    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const deviceRepo = new DeviceRepository();
    const success = await deviceRepo.delete(deviceId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting device:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete device'
    }, { status: 500 });
  }
}