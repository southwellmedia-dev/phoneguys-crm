import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/internal-notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new InternalNotificationService();
    const notification = await service.markAsRead(id);

    return NextResponse.json({ data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}