import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { ApiKeysService } from '@/lib/services/api-keys.service';

// GET - List all API keys for the current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check admin access
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKeysService = new ApiKeysService();

    const result = await apiKeysService.getAllApiKeys();

    if (result.error) {
      console.error('Error fetching API keys:', result.error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error in GET /api/admin/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check admin access
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKeysService = new ApiKeysService();

    const body = await request.json();
    const { name, description, domains = [], permissions = ['form_submission'], expiresInDays } = body;

    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    try {
      const apiKey = await apiKeysService.createApiKey({
        name,
        description,
        domains,
        permissions,
        expiresInDays,
        userId: authResult.user.id
      });

      // Return the API key (only time the actual key is shown)
      return NextResponse.json({ 
        data: apiKey,
        message: 'API key created successfully. Please save the key securely as it won\'t be shown again.'
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Check admin access
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKeysService = new ApiKeysService();

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    const result = await apiKeysService.deleteApiKey(keyId);

    if (result.error) {
      console.error('Error deleting API key:', result.error);
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}