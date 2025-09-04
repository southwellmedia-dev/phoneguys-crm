import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ServiceService } from '@/lib/services/service.service';
import { UserRepository } from '@/lib/repositories/user.repository';
import { checkAdminAuthOptimized } from '@/lib/auth/admin-auth';
import { z } from 'zod';

const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  category: z.enum([
    'screen_repair', 'battery_replacement', 'charging_port', 'water_damage', 
    'diagnostic', 'software_issue', 'camera_repair', 'speaker_repair',
    'button_repair', 'motherboard_repair', 'data_recovery', 'other'
  ]).optional(),
  base_price: z.number().min(0, 'Price must be positive').optional(),
  estimated_duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
  requires_parts: z.boolean().default(false),
  skill_level: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
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
 * Create a new service
 */
export async function POST(request: NextRequest) {
  const authError = await checkAdminAuthOptimized();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validatedData = CreateServiceSchema.parse(body);

    const serviceService = new ServiceService();
    const service = await serviceService.createService(validatedData);
    
    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
    
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: (error as any).errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating service:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create service'
    }, { status: 500 });
  }
}

/**
 * Get all services (with optional filtering)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const authError = await checkAdminAuthOptimized();
  if (authError) return authError;
  
  const authTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    const serviceService = new ServiceService();
    const queryStart = Date.now();
    
    let services;
    if (search) {
      services = await serviceService.searchServices(search);
    } else if (category) {
      services = await serviceService.getServicesByCategory(category as any);
    } else {
      services = await serviceService.getAllActiveServices();
    }
    
    const queryTime = Date.now() - queryStart;
    const authTimeMs = authTime - startTime;

    // Filter by active status if specified
    if (active !== null) {
      const isActive = active === 'true';
      services = services.filter(s => s.is_active === isActive);
    }
    
    const totalTime = Date.now() - startTime;
    
    // Always log performance for debugging
    console.log(`🚀 SERVICES API PERFORMANCE:`);
    console.log(`   Auth: ${authTimeMs}ms`);
    console.log(`   Query: ${queryTime}ms`);  
    console.log(`   Total: ${totalTime}ms`);
    console.log(`   Services: ${services.length}`);
    
    return NextResponse.json({
      success: true,
      data: services
    });
    
  } catch (error) {
    const errorTime = Date.now();
    console.error(`[Services API] Error after ${errorTime - startTime}ms:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch services'
    }, { status: 500 });
  }
}