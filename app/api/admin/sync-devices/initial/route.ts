import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeviceSyncInitialService } from '@/lib/services/device-sync-initial.service';
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
    const { apiKey, totalDevices = 100, autoImport = true, fetchFullDetails = true } = body;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    console.log('Starting initial device sync...');
    console.log(`Options: totalDevices=${totalDevices}, fetchFullDetails=${fetchFullDetails}`);
    
    const syncService = new DeviceSyncInitialService(supabase);
    const result = await syncService.performInitialSync(apiKey, {
      totalDevices,
      autoImport,
      fetchFullDetails
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully imported ${result.devicesImported} devices`
        : 'Initial sync failed',
      devicesImported: result.devicesImported,
      totalFound: result.totalFound,
      brandBreakdown: result.brandBreakdown,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Error in initial sync:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform initial sync' 
      },
      { status: 500 }
    );
  }
}