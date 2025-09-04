import { NextRequest, NextResponse } from 'next/server';
import { CustomerDeviceService } from '@/lib/services/customer-device.service';
import { requireAuth, handleApiError, successResponse } from '@/lib/auth/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = params.id;
    
    // Get customer devices
    const customerDeviceService = new CustomerDeviceService();
    const result = await customerDeviceService.getCustomerDevices(customerId);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return successResponse(result.data || [], 'Customer devices retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = params.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.device_id) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    // Add device to customer
    const customerDeviceService = new CustomerDeviceService();
    const result = await customerDeviceService.addDeviceToCustomer(customerId, body);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return successResponse(result.data, 'Device added to customer successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}