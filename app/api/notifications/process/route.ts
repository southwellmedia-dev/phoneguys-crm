import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Require authentication and manage permission
    const authResult = await requirePermission(request, Permission.NOTIFICATION_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    // Check if we should use Edge Function or local processing
    const { searchParams } = new URL(request.url);
    const useEdgeFunction = searchParams.get('edge') === 'true';
    
    if (useEdgeFunction) {
      // Call the Supabase Edge Function
      const supabase = await createClient();
      
      // Get the Edge Function URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-email-queue`;
      
      // Call the Edge Function with service role key for authentication
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Edge Function error: ${error}`);
      }

      const result = await response.json();
      
      return successResponse(
        result,
        result.message || `Processed via Edge Function`
      );
    } else {
      // Use local processing with NotificationService
      const notificationService = new NotificationService();
      const result = await notificationService.processPendingNotifications();

      return successResponse(
        result,
        `Processed ${result.processed} notifications, ${result.failed} failed`
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}