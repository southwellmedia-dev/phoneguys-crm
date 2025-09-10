import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settings.service';
import { requireAuth } from '@/lib/auth/helpers';

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Check admin access
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const service = new SettingsService(true);
    const result = await service.updateAppointmentSettings(body);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating appointment settings:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment settings' },
      { status: 500 }
    );
  }
}