import { NextRequest, NextResponse } from 'next/server';
import { DeviceRepository } from '@/lib/repositories/device.repository';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { deviceId, imageUrl } = body;

    if (!deviceId || !imageUrl) {
      return NextResponse.json({ error: 'Missing device ID or image URL' }, { status: 400 });
    }

    // Update device in database
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: imageUrl,
      thumbnail_url: imageUrl // Use the same URL for thumbnail
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        device: updatedDevice,
        imageUrl 
      } 
    });

  } catch (error) {
    console.error('Error selecting device image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to select image' },
      { status: 500 }
    );
  }
}