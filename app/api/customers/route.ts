import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/customer.service';
import { requirePermission, handleApiError, successResponse, paginatedResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { z } from 'zod';

// Validation schema for creating customer
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');

    // Create service instance
    const customerService = new CustomerService();

    // If search term provided, use search functionality
    if (search && search.length >= 2) {
      const customers = await customerService.searchCustomers(search);
      return successResponse(customers);
    }

    // Otherwise get paginated list
    const result = await customerService.getCustomers(
      undefined,
      page,
      pageSize
    );

    return paginatedResponse(
      result.data,
      result.page,
      result.pageSize,
      result.total
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication and create permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_CREATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    // Validate input
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten() 
        },
        { status: 400 }
      );
    }

    // Create service instance
    const customerService = new CustomerService();

    // Create customer
    const customer = await customerService.createCustomer({
      ...validation.data,
      is_active: true,
      created_at: new Date().toISOString()
    });

    return successResponse(customer, 'Customer created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}