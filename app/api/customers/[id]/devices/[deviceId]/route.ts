import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const params = await context.params;
    const { deviceId } = params;
    const body = await request.json();
    
    console.log('Updating device:', deviceId, 'with data:', body);
    
    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.customer_id;
    delete body.device_id;
    delete body.created_at;
    delete body.updated_at;
    
    // Convert empty strings to null for database fields
    Object.keys(body).forEach(key => {
      if (body[key] === '') {
        body[key] = null;
      }
    });
    
    // Update device
    const customerDeviceRepo = getRepository.customerDevices();
    
    // If setting as primary, unset other primary devices first
    if (body.is_primary === true) {
      await customerDeviceRepo.setPrimaryDevice(params.id, deviceId);
      delete body.is_primary; // Remove from update since setPrimaryDevice handles it
    } else if (body.is_primary === false) {
      // Just update normally, don't need special handling for unsetting primary
    }
    
    // Only update if there are fields to update
    let updatedDevice;
    if (Object.keys(body).length > 0) {
      updatedDevice = await customerDeviceRepo.update(deviceId, body);
    } else {
      // If no fields to update (e.g., only primary was set), fetch the current device
      updatedDevice = await customerDeviceRepo.findById(deviceId);
    }
    
    if (!updatedDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return successResponse(updatedDevice, 'Device updated successfully');
  } catch (error) {
    console.error('Error updating device:', error);
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const params = await context.params;
    const { deviceId } = params;
    
    // Soft delete the device
    const customerDeviceRepo = getRepository.customerDevices();
    const result = await customerDeviceRepo.update(deviceId, { is_active: false });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return successResponse(null, 'Device removed successfully');
  } catch (error) {
    return handleApiError(error);
  }
}