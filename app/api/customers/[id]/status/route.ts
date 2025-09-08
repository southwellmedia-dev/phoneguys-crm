import { NextRequest, NextResponse } from 'next/server';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { requireAuth, handleApiError } from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const customerId = resolvedParams.id;
    const customerRepo = new CustomerRepository(true);

    // Get the customer to fetch its current status
    const customer = await customerRepo.findById(customerId);
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Customers don't typically have a status field, so we'll default to 'active'
    // or check if they have any active repair tickets
    const status = customer.is_active !== false ? 'active' : 'inactive';

    return NextResponse.json({ 
      status: status,
      id: customer.id,
      updated_at: customer.updated_at || customer.created_at
    });
  } catch (error) {
    return handleApiError(error);
  }
}