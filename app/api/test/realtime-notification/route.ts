import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InternalNotificationService } from '@/lib/services/internal-notification.service';
import { InternalNotificationType, InternalNotificationPriority } from '@/lib/types/internal-notification.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📧 Creating test notification for user:', user.id, user.email);

    // Create a test notification
    const notificationService = new InternalNotificationService(true);
    const notification = await notificationService.createNotification({
      user_id: user.id,
      type: InternalNotificationType.SYSTEM_ALERT,
      title: `Test Notification at ${new Date().toLocaleTimeString()}`,
      message: 'This is a test notification to verify real-time updates are working',
      priority: InternalNotificationPriority.HIGH,
      action_url: '/orders',
      created_by: user.id
    });

    console.log('✅ Test notification created:', notification);

    return NextResponse.json({ 
      success: true, 
      notification,
      userId: user.id,
      userEmail: user.email 
    });
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test notification' },
      { status: 500 }
    );
  }
}