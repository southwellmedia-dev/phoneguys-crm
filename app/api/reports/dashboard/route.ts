import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/reporting.service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

export async function GET(request: NextRequest) {
  try {
    // Require authentication and report view permission
    const authResult = await requirePermission(request, Permission.REPORT_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    // Create service instance
    const reportingService = new ReportingService();

    // Get dashboard metrics
    const metrics = await reportingService.getDashboardMetrics();

    return successResponse(metrics);
  } catch (error) {
    return handleApiError(error);
  }
}