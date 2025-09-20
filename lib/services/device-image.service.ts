import { createClient } from '@/lib/supabase/client';
import { createServiceClient } from '@/lib/supabase/service';

export class DeviceImageService {
  private bucketName = 'device-images';

  /**
   * Initialize storage bucket (run once)
   */
  async initializeBucket() {
    const supabase = createServiceClient();
    
    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === this.bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.bucketName, {
        public: true, // Makes images publicly accessible
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
      });
      
      if (error) throw error;
      console.log('Device images bucket created');
    }
  }

  /**
   * Upload device image to Supabase Storage
   */
  async uploadDeviceImage(file: File, deviceModelName: string): Promise<string> {
    const supabase = createServiceClient(); // Use service client to bypass RLS
    
    // Clean filename: lowercase, replace spaces with hyphens
    const cleanName = deviceModelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const fileExt = file.name.split('.').pop();
    const fileName = `${cleanName}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        upsert: true, // Overwrite if exists
        cacheControl: '3600',
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Upload image from URL (for migration/sync)
   */
  async uploadFromUrl(imageUrl: string, deviceModelName: string): Promise<string> {
    try {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const file = new File([blob], `${deviceModelName}.jpg`, { type: blob.type });
      
      return this.uploadDeviceImage(file, deviceModelName);
    } catch (error) {
      console.error('Error uploading from URL:', error);
      throw error;
    }
  }

  /**
   * Delete device image
   */
  async deleteDeviceImage(fileName: string): Promise<void> {
    const supabase = createServiceClient();
    
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([fileName]);

    if (error) throw error;
  }

  /**
   * Get image URL from Supabase Storage
   */
  getImageUrl(fileName: string): string {
    const supabase = createServiceClient();
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);
    
    return publicUrl;
  }

  /**
   * Migrate local images to Supabase Storage
   * Run this once to upload all images from public folder
   */
  async migrateLocalImages(devices: Array<{ id: string; model_name: string; image_url?: string }>) {
    const results = [];
    
    for (const device of devices) {
      if (device.image_url?.startsWith('/images/devices/')) {
        try {
          // Convert local path to full URL for dev environment
          const localUrl = `http://localhost:3000${device.image_url}`;
          const newUrl = await this.uploadFromUrl(localUrl, device.model_name);
          
          results.push({
            deviceId: device.id,
            oldUrl: device.image_url,
            newUrl,
            status: 'success'
          });
        } catch (error) {
          results.push({
            deviceId: device.id,
            oldUrl: device.image_url,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          });
        }
      }
    }
    
    return results;
  }
}