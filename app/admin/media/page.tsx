import { MediaGallery } from './media-gallery-client';
import { DeviceImageService } from '@/lib/services/device-image.service';
import { createServiceClient } from '@/lib/supabase/service';

async function getStorageImages() {
  try {
    const supabase = createServiceClient();
    
    // List all files in the device-images bucket
    const { data: files, error } = await supabase.storage
      .from('device-images')
      .list('', {
        limit: 1000,
        offset: 0,
      });

    if (error) {
      console.error('Error fetching images:', error);
      return [];
    }

    // Map files to include public URLs
    const imageService = new DeviceImageService();
    const imagesWithUrls = files?.map(file => ({
      ...file,
      url: imageService.getImageUrl(file.name),
      size: file.metadata?.size || 0,
    })) || [];

    return imagesWithUrls;
  } catch (error) {
    console.error('Error in getStorageImages:', error);
    return [];
  }
}

export default async function MediaGalleryPage() {
  const images = await getStorageImages();

  return <MediaGallery initialImages={images} />;
}