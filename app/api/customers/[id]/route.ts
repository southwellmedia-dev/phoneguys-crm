import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/lib/services/customer.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Validation schema for updating customer
const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional()
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = resolvedParams.id;
    
    // Create service instance
    const customerService = new CustomerService();
    const customer = await customerService.getCustomerById(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and update permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = resolvedParams.id;
    const body = await request.json();

    // Validate input
    const validation = updateCustomerSchema.safeParse(body);
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

    // Update customer
    const updatedCustomer = await customerService.updateCustomer(
      customerId,
      validation.data
    );

    return successResponse(updatedCustomer, 'Customer updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Require authentication and delete permission
    const authResult = await requirePermission(request, Permission.CUSTOMER_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = resolvedParams.id;
    
    // Create service instance
    const customerService = new CustomerService();

    // Delete customer (soft delete)
    await customerService.deleteCustomer(customerId);

    return successResponse(null, 'Customer deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}