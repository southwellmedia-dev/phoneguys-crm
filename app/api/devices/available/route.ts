import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';

/**
 * Get available device models
 * Used by the customer devices component to show device selection
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Get repository instance using singleton manager
    const deviceRepo = getRepository.devices();
    
    // Get all active devices
    const devices = await deviceRepo.getActiveDevices();
    
    // Transform for client use
    const availableDevices = devices.map(device => ({
      id: device.id,
      model_name: device.model_name,
      manufacturer: device.manufacturer,
      device_type: device.device_type,
      image_url: device.image_url,
    }));
    
    return successResponse(availableDevices);
  } catch (error) {
    return handleApiError(error);
  }
}