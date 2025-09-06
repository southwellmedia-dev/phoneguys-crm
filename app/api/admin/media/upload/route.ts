import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { DeviceImageService } from '@/lib/services/device-image.service';

export async function POST(request: NextRequest) {
  try {
    // Require permission to update tickets (since media is mainly used for device images in tickets)
    const authResult = await requirePermission(request, Permission.TICKET_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const imageService = new DeviceImageService();
    
    // Upload image
    const publicUrl = await imageService.uploadDeviceImage(
      file, 
      name || file.name.replace(/\.[^/.]+$/, '') // Use provided name or filename without extension
    );

    return successResponse({
      name: file.name,
      url: publicUrl,
      size: file.size,
    }, 'Image uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    return handleApiError(error);
  }
}