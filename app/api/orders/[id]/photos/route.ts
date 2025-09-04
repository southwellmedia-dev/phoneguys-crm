import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';
import { TicketPhotoService } from '@/lib/services/ticket-photo.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requirePermission(request, Permission.TICKET_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const photoService = new TicketPhotoService();
    
    // Initialize bucket if needed
    await photoService.initializeBucket();
    
    // Get all photos for this ticket
    const photos = await photoService.getTicketPhotos(ticketId);
    
    return successResponse(photos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    
    // Require authentication
    const authResult = await requirePermission(request, Permission.TICKET_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const ticketId = resolvedParams.id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const tagsJson = formData.get('tags') as string;
    const serviceId = formData.get('serviceId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB max for ticket photos)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }
    
    const photoService = new TicketPhotoService();
    
    // Initialize bucket if needed
    await photoService.initializeBucket();
    
    // Parse tags
    let tags: string[] = [];
    try {
      if (tagsJson) {
        tags = JSON.parse(tagsJson);
      }
    } catch (e) {
      console.error('Failed to parse tags:', e);
    }

    // Handle legacy before/after type by adding to tags
    if (type === 'before' && !tags.includes('before')) {
      tags.push('before');
    }
    if (type === 'after' && !tags.includes('after')) {
      tags.push('after');
    }

    // Upload photo
    const photo = await photoService.uploadTicketPhoto(
      ticketId,
      file,
      authResult.userId,
      {
        description,
        isBefore: type === 'before',
        isAfter: type === 'after',
        tags,
        serviceId,
      }
    );
    
    return successResponse(photo, 'Photo uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    return handleApiError(error);
  }
}