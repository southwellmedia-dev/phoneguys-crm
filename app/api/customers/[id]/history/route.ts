import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/customer.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = params.id;
    
    // Create service instance
    const customerService = new CustomerService();
    
    // Get customer history
    const history = await customerService.getCustomerHistory(customerId);

    return successResponse(history);
  } catch (error) {
    return handleApiError(error);
  }
}