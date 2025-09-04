import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeviceRepository } from '@/lib/repositories/device.repository';
import { UserRepository } from '@/lib/repositories/user.repository';
import { z } from 'zod';

const CreateDeviceSchema = z.object({
  manufacturer_id: z.string().uuid('Invalid manufacturer ID'),
  model_name: z.string().min(1, 'Model name is required').max(200),
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

export async function GET() {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const deviceRepo = new DeviceRepository();
    const devices = await deviceRepo.getActiveDevices();
    
    return NextResponse.json({ success: true, data: devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validatedData = CreateDeviceSchema.parse(body);

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
    const device = await deviceRepo.create(cleanedData);
    
    return NextResponse.json({ success: true, data: device }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating device:', error);
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    );
  }
}