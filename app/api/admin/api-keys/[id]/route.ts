import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { ApiKeysService } from '@/lib/services/api-keys.service';

// PATCH - Update an API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check admin access
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKeysService = new ApiKeysService();

    const body = await request.json();
    const { is_active, domains, name, description, rate_limit_per_hour } = body;

    try {
      const result = await apiKeysService.updateApiKey(params.id, {
        is_active,
        domains,
        name,
        description,
        rate_limit_per_hour
      });

      if (result.error) {
        console.error('Error updating API key:', result.error);
        return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
      }

      return NextResponse.json({ message: 'API key updated successfully' });
    } catch (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in PATCH /api/admin/api-keys/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}