import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/devices/delete-image
 * Delete image for a device
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['admin', 'manager']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { deviceId } = body;

    console.log('[Delete Image] Request for device:', deviceId);

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing device ID' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // Get current device image
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('image_url, thumbnail_url')
      .eq('id', deviceId)
      .single();
    
    if (fetchError || !device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    if (!device.image_url && !device.thumbnail_url) {
      return NextResponse.json({
        success: true,
        message: 'Device has no image to delete'
      });
    }

    // Extract filename from URL if it's a Supabase storage URL
    let deletedFromStorage = false;
    if (device.image_url && device.image_url.includes('device-images')) {
      try {
        // Extract the filename from the URL
        const urlParts = device.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName && fileName.startsWith(deviceId)) {
          console.log('[Delete Image] Deleting from storage:', fileName);
          
          // Delete from storage bucket
          const { error: deleteError } = await supabase.storage
            .from('device-images')
            .remove([fileName]);
          
          if (deleteError) {
            console.error('[Delete Image] Storage deletion error:', deleteError);
          } else {
            deletedFromStorage = true;
            console.log('[Delete Image] Successfully deleted from storage');
          }
        }
      } catch (error) {
        console.error('[Delete Image] Error parsing storage URL:', error);
      }
    }

    // Clear the image URLs from the database
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        image_url: null,
        thumbnail_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);
    
    if (updateError) {
      console.error('[Delete Image] Failed to update device:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update device record'
      }, { status: 500 });
    }

    console.log('[Delete Image] Successfully cleared image URLs for device:', deviceId);
    
    return NextResponse.json({
      success: true,
      message: deletedFromStorage ? 'Image deleted from storage and database' : 'Image URLs cleared from database',
      deletedFromStorage
    });

  } catch (error) {
    console.error('[Delete Image] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete device image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}