import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { DeviceImagePopulatorService } from '@/lib/services/device-image-populator.service';

/**
 * POST /api/admin/devices/populate-images
 * Populate images for devices that don't have them
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authResult = await requireAuth(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { 
      limit = 10, // Default to 10 devices at a time to avoid timeout
      deviceId = null // Optional: populate single device
    } = body;

    const populator = new DeviceImagePopulatorService();
    
    // If specific device requested
    if (deviceId) {
      const result = await populator.populateDeviceImage(deviceId);
      return NextResponse.json(result);
    }
    
    // Otherwise populate multiple devices
    console.log(`[Device Images] Starting population for up to ${limit} devices`);
    
    const results = await populator.populateAllDeviceImages({ 
      limit,
      onProgress: (current, total, device) => {
        console.log(`[Device Images] Progress: ${current}/${total} - ${device}`);
      }
    });
    
    return NextResponse.json({
      success: results.updated > 0,
      message: `Successfully updated ${results.updated} out of ${results.total} devices`,
      results
    });

  } catch (error) {
    console.error('[Device Images] Population error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate device images',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/devices/populate-images
 * Get statistics about device images
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['admin', 'manager']);
    if (authResult instanceof NextResponse) return authResult;

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();
    
    // Get image statistics
    const { data: stats, error } = await supabase
      .from('devices')
      .select('id, image_url', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    const total = stats?.length || 0;
    const withImages = stats?.filter(d => d.image_url)?.length || 0;
    const withoutImages = total - withImages;
    
    // Get breakdown by manufacturer
    const { data: byManufacturer } = await supabase
      .from('devices')
      .select(`
        manufacturers!inner (
          name
        ),
        image_url
      `);
    
    const manufacturerStats: Record<string, { total: number; withImages: number }> = {};
    
    byManufacturer?.forEach(device => {
      const name = device.manufacturers?.name || 'Unknown';
      if (!manufacturerStats[name]) {
        manufacturerStats[name] = { total: 0, withImages: 0 };
      }
      manufacturerStats[name].total++;
      if (device.image_url) {
        manufacturerStats[name].withImages++;
      }
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        total,
        withImages,
        withoutImages,
        percentageComplete: total > 0 ? Math.round((withImages / total) * 100) : 0,
        byManufacturer: manufacturerStats
      }
    });

  } catch (error) {
    console.error('[Device Images] Stats error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get device image statistics'
      },
      { status: 500 }
    );
  }
}