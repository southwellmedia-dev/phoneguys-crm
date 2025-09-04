import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { TicketPhotoService } from '@/lib/services/ticket-photo.service';

interface RouteParams {
  params: Promise<{
    id: string;
    photoId: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requirePermission(request, Permission.TICKET_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const { photoId } = resolvedParams;
    const photoService = new TicketPhotoService();
    
    // Delete the photo
    await photoService.deleteTicketPhoto(photoId);
    
    return successResponse(null, 'Photo deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}