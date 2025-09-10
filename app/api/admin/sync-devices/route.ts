import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeviceSyncService } from '@/lib/services/device-sync.service';
import { DeviceSyncMultiService } from '@/lib/services/device-sync-multi.service';
import { getRepository } from '@/lib/repositories/repository-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin using the same pattern as other admin routes
    const userRepo = getRepository.users();
    const userData = await userRepo.findByEmail(user.email || '');
    
    if (!userData || userData.role !== 'admin') {
      console.log('User is not admin:', userData?.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { source, apiKey, limit, testMode, brand, autoImport, fetchFullDetails } = body;
    
    let result;
    
    switch(source) {
      case 'techspecs':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key required for TechSpecs' }, { status: 400 });
        }
        
        // Use multi-service for all manufacturers, regular service for single brand
        const syncService = (!brand || brand === '') ? 
          new DeviceSyncMultiService(supabase) : 
          new DeviceSyncService(supabase);
        
        // Use smart sync to check existing devices first
        const syncResult = (!brand || brand === '') ?
          await (syncService as DeviceSyncMultiService).smartSyncMultipleDevices(apiKey, {
            limit: testMode ? 1 : (limit || 10),
            autoImport: autoImport || false,
            fetchFullDetails: fetchFullDetails || false
          }) :
          await syncService.smartSyncDevices(apiKey, {
            limit: testMode ? 1 : (limit || 10),
            brand: brand || undefined,
            autoImport: autoImport || false,
            fetchFullDetails: fetchFullDetails || false
          });
        
        // Convert to expected format
        result = {
          success: syncResult.success,
          existingDevices: syncResult.existingDevices,
          newDevices: syncResult.newDevices,
          devicesUpdated: syncResult.updatedCount,
          updatedDevices: syncResult.updatedDevices,
          devicesAdded: 0,  // Will be set if autoImport is true
          errors: syncResult.errors,
          message: syncResult.message
        };
        
        // If autoImport is enabled and there are new devices, import them
        if (autoImport && syncResult.newDevices.length > 0) {
          const importService = new DeviceSyncService(supabase);
          const importResult = await importService.importNewDevices(syncResult.newDevices);
          result.devicesAdded = importResult.imported;
          if (importResult.errors.length > 0) {
            result.errors = [...(result.errors || []), ...importResult.errors];
          }
        }
        
        // Add brand results if available (from multi-sync)
        if ('brandResults' in syncResult && syncResult.brandResults) {
          result.brandResults = syncResult.brandResults;
        }
        break;
        
      case 'popular':
        const popularService = new DeviceSyncService(supabase);
        result = await popularService.syncPopularDevices();
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid sync source' }, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error syncing devices:', error);
    return NextResponse.json(
      { error: 'Failed to sync devices' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const limit = searchParams.get('limit') || '50';
    
    // Build query
    let query = supabase
      .from('devices')
      .select('*')
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .order('release_date', { ascending: false })
      .limit(parseInt(limit));
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%,brand.ilike.%${search}%`);
    }
    
    if (brand) {
      query = query.eq('brand', brand);
    }
    
    const { data: devices, error } = await query;
    
    if (error) {
      console.error('Error fetching devices:', error);
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
    
    // Get brand counts
    const { data: brands } = await supabase
      .from('devices')
      .select('brand')
      .eq('is_active', true);
    
    const brandCounts = brands?.reduce((acc: any, device: any) => {
      acc[device.brand] = (acc[device.brand] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      devices: devices || [],
      brands: Object.entries(brandCounts || {}).map(([brand, count]) => ({
        brand,
        count
      })).sort((a: any, b: any) => b.count - a.count)
    });
    
  } catch (error) {
    console.error('Error in devices API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}