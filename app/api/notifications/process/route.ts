import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

export async function POST(request: NextRequest) {
  try {
    // Require authentication and manage permission
    const authResult = await requirePermission(request, Permission.NOTIFICATION_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    // Create service instance
    const notificationService = new NotificationService();

    // Process pending notifications
    const result = await notificationService.processPendingNotifications();

    return successResponse(
      result,
      `Processed ${result.processed} notifications, ${result.failed} failed`
    );
  } catch (error) {
    return handleApiError(error);
  }
}