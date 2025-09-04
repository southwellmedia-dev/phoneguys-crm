import { NextRequest, NextResponse } from 'next/server';
import { DeviceRepository } from '@/lib/repositories/device.repository';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deviceId = params.id;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    // Update device in database to remove image URLs
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: null,
      thumbnail_url: null
    });

    return NextResponse.json({ 
      success: true, 
      data: { device: updatedDevice } 
    });

  } catch (error) {
    console.error('Error removing device image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove image' },
      { status: 500 }
    );
  }
}