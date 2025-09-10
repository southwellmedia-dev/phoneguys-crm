import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { checkAdminAuthOptimized } from '@/lib/auth/admin-auth';
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

  const userRepo = getRepository.users();
  const userData = await userRepo.findByEmail(user.email || '');
  
  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const startTime = Date.now();
  
  const authError = await checkAdminAuthOptimized();
  if (authError) return authError;
  
  const authTime = Date.now();
  console.log(`[Devices API] Auth check took: ${authTime - startTime}ms`);

  try {
    const queryStart = Date.now();
    const deviceRepo = getRepository.devices();
    const devices = await deviceRepo.getActiveDevices();
    const queryTime = Date.now() - queryStart;
    console.log(`[Devices API] Database query took: ${queryTime}ms`);
    
    // Check if devices is an array
    if (!Array.isArray(devices)) {
      console.error('[Devices API] Devices is not an array:', typeof devices, devices);
      throw new Error('Invalid devices data structure');
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[Devices API] Total request time: ${totalTime}ms`);
    console.log(`[Devices API] Returning ${devices.length} devices`);
    
    return NextResponse.json({ success: true, data: devices });
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[Devices API] Error after ${errorTime}ms:`, error);
    console.error('[Devices API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch devices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuthOptimized();
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

    const deviceRepo = getRepository.devices();
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