import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeviceSyncService } from '@/lib/services/device-sync.service';
import { getRepository } from '@/lib/repositories/repository-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userRepo = getRepository.users();
    const userData = await userRepo.findByEmail(user.email || '');
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { apiKey } = body;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    const syncService = new DeviceSyncService(supabase);
    const result = await syncService.testTechSpecsConnection(apiKey);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error testing TechSpecs connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
}