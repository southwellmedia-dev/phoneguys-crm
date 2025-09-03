import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { z } from 'zod';

// Validation schema for sending notification
const sendNotificationSchema = z.object({
  ticket_id: z.string().uuid(),
  recipient_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  scheduled_for: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Require authentication and view permission
    const authResult = await requirePermission(request, Permission.NOTIFICATION_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Create service instance
    const notificationService = new NotificationService();

    // Get notifications with filters
    const notifications = await notificationService.getNotifications({
      status: status as any,
      type: type as any,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    return successResponse(notifications);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication and send permission
    const authResult = await requirePermission(request, Permission.NOTIFICATION_SEND);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    // Validate input
    const validation = sendNotificationSchema.safeParse(body);
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
    const notificationService = new NotificationService();

    // Schedule custom notification
    const notification = await notificationService.scheduleCustomNotification(
      validation.data.ticket_id,
      validation.data.recipient_email,
      validation.data.subject,
      validation.data.body,
      validation.data.scheduled_for ? new Date(validation.data.scheduled_for) : undefined
    );

    return successResponse(notification, 'Notification scheduled successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}