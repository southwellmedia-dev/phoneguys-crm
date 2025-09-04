import { createClient } from '@/lib/supabase/client';
import { createServiceClient } from '@/lib/supabase/service';

export interface TicketPhoto {
  id: string;
  ticket_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
  is_before_photo?: boolean;
  is_after_photo?: boolean;
  tags?: string[];
  service_id?: string;
  url?: string;
}

export class TicketPhotoService {
  private mainBucket = 'ticket-photos';

  /**
   * Initialize storage bucket (run once)
   */
  async initializeBucket() {
    const supabase = createServiceClient();
    
    // Create main bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === this.mainBucket);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.mainBucket, {
        public: false, // Private bucket for ticket photos
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic']
      });
      
      if (error && error.message !== 'Bucket already exists') {
        throw error;
      }
      console.log('Ticket photos bucket created');
    }
  }

  /**
   * Upload photo for a specific ticket
   */
  async uploadTicketPhoto(
    ticketId: string,
    file: File,
    uploadedBy: string,
    options?: {
      description?: string;
      isBefore?: boolean;
      isAfter?: boolean;
      tags?: string[];
      serviceId?: string;
    }
  ): Promise<TicketPhoto> {
    const supabase = createServiceClient();
    
    // Clean filename and create path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9-]/gi, '-');
    const fileName = `${timestamp}-${cleanName}.${fileExt}`;
    const filePath = `${ticketId}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.mainBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    // Get the public URL (even though bucket is private, we can generate signed URLs)
    const { data: { signedUrl }, error: urlError } = await supabase.storage
      .from(this.mainBucket)
      .createSignedUrl(filePath, 31536000); // 1 year expiry

    if (urlError) throw urlError;

    // Save metadata to database
    const photoData: Partial<TicketPhoto> = {
      ticket_id: ticketId,
      file_name: fileName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      description: options?.description,
      is_before_photo: options?.isBefore || false,
      is_after_photo: options?.isAfter || false,
      tags: options?.tags || [],
      service_id: options?.serviceId,
    };

    const { data: savedPhoto, error: dbError } = await supabase
      .from('ticket_photos')
      .insert(photoData)
      .select()
      .single();

    if (dbError) {
      // If database save fails, delete the uploaded file
      await supabase.storage.from(this.mainBucket).remove([filePath]);
      throw dbError;
    }

    return { ...savedPhoto, url: signedUrl };
  }

  /**
   * Get all photos for a ticket
   */
  async getTicketPhotos(ticketId: string): Promise<TicketPhoto[]> {
    const supabase = createServiceClient();
    
    // Get photo metadata from database
    const { data: photos, error: dbError } = await supabase
      .from('ticket_photos')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('uploaded_at', { ascending: false });

    if (dbError) throw dbError;

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: { signedUrl } } = await supabase.storage
          .from(this.mainBucket)
          .createSignedUrl(photo.file_path, 3600); // 1 hour expiry for viewing
        
        return { ...photo, url: signedUrl };
      })
    );

    return photosWithUrls;
  }

  /**
   * Delete a ticket photo
   */
  async deleteTicketPhoto(photoId: string): Promise<void> {
    const supabase = createServiceClient();
    
    // Get photo metadata
    const { data: photo, error: fetchError } = await supabase
      .from('ticket_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) throw fetchError;
    if (!photo) throw new Error('Photo not found');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.mainBucket)
      .remove([photo.file_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('ticket_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;
  }

  /**
   * Delete all photos for a ticket
   */
  async deleteTicketPhotos(ticketId: string): Promise<void> {
    const photos = await this.getTicketPhotos(ticketId);
    
    for (const photo of photos) {
      await this.deleteTicketPhoto(photo.id);
    }
  }

  /**
   * Get before/after photos for a ticket
   */
  async getBeforeAfterPhotos(ticketId: string): Promise<{
    before: TicketPhoto[];
    after: TicketPhoto[];
  }> {
    const photos = await this.getTicketPhotos(ticketId);
    
    return {
      before: photos.filter(p => p.is_before_photo),
      after: photos.filter(p => p.is_after_photo),
    };
  }

  /**
   * Generate a shareable link for ticket photos (for customer viewing)
   */
  async generateShareableLink(ticketId: string, expiryHours = 24): Promise<string> {
    const supabase = createServiceClient();
    
    // Create a token for viewing photos
    const token = btoa(`ticket-photos:${ticketId}:${Date.now()}`);
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);
    
    // Store token in database
    const { error } = await supabase
      .from('ticket_photo_shares')
      .insert({
        ticket_id: ticketId,
        token,
        expires_at: expiryTime.toISOString(),
      });

    if (error) throw error;

    // Return the shareable link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/tickets/photos/${token}`;
  }
}