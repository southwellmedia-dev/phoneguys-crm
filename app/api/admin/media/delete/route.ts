import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { DeviceImageService } from '@/lib/services/device-image.service';

export async function DELETE(request: NextRequest) {
  try {
    // Require admin permission
    const authResult = await requirePermission(request, Permission.USER_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      );
    }

    const imageService = new DeviceImageService();
    
    // Delete image from storage
    await imageService.deleteDeviceImage(fileName);

    return successResponse(null, 'Image deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
    return handleApiError(error);
  }
}