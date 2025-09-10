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
    
    let result;
    if (body.dayOfWeek !== undefined && body.hours) {
      // Update single day
      result = await service.updateBusinessHours(body.dayOfWeek, body.hours);
    } else if (Array.isArray(body)) {
      // Update all days
      result = await service.updateAllBusinessHours(body);
    } else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating business hours:', error);
    return NextResponse.json(
      { error: 'Failed to update business hours' },
      { status: 500 }
    );
  }
}