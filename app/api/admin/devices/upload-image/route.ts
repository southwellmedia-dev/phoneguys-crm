import { NextRequest, NextResponse } from 'next/server';
import { DeviceImageService } from '@/lib/services/device-image.service';
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deviceId = formData.get('deviceId') as string;
    const deviceName = formData.get('deviceName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!deviceId || !deviceName) {
      return NextResponse.json({ error: 'Missing device information' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Upload image
    const imageService = new DeviceImageService();
    const imageUrl = await imageService.uploadDeviceImage(file, deviceName);

    // Update device in database
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: imageUrl,
      thumbnail_url: imageUrl // Use the same URL for thumbnail for now
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        device: updatedDevice,
        imageUrl 
      } 
    });

  } catch (error) {
    console.error('Error uploading device image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}