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
    const { devices, downloadThumbnails } = body;
    
    if (!devices || !Array.isArray(devices)) {
      return NextResponse.json({ error: 'Invalid devices data' }, { status: 400 });
    }
    
    const syncService = new DeviceSyncService(supabase);
    const result = await syncService.importNewDevices(devices);
    
    // Optionally download thumbnails
    if (downloadThumbnails) {
      const downloadPromises = devices
        .filter(d => d.image_url)
        .map(async (device) => {
          // Find the imported device to get its ID
          const { data: importedDevice } = await supabase
            .from('devices')
            .select('id')
            .eq('external_id', device.external_id)
            .single();
          
          if (importedDevice) {
            return syncService.downloadAndStoreThumbnail(importedDevice.id, device.image_url);
          }
        });
      
      await Promise.all(downloadPromises);
    }
    
    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Error importing devices:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import devices' 
      },
      { status: 500 }
    );
  }
}