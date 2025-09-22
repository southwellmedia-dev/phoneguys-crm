import { createServiceClient } from '@/lib/supabase/service';
import { DeviceImageService } from './device-image.service';

interface DeviceImageSource {
  name: string;
  priority: number;
  getImageUrl: (manufacturer: string, model: string) => string | null;
  requiresValidation?: boolean;
}

export class DeviceImagePopulatorService {
  private deviceImageService: DeviceImageService;
  private supabase = createServiceClient();
  private mobileApiKey = '55c15cad972f723b3202b6854d0dc7e1e124070f';
  
  // Define image sources in priority order
  private imageSources: DeviceImageSource[] = [
    {
      name: 'daisycon',
      priority: 1,
      getImageUrl: (manufacturer: string, model: string) => {
        // Daisycon provides free device images based on brand + model
        // Clean up the model name for better matching
        const cleanModel = model.toLowerCase()
          .replace(/apple\s*/i, '')
          .replace(/samsung\s*/i, '')
          .replace(/google\s*/i, '')
          .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
          .trim();
        
        const cleanBrand = manufacturer.toLowerCase().trim();
        
        // Daisycon API - no authentication needed!
        // We use a white background and 800x800 for high quality
        const params = new URLSearchParams({
          width: '800',
          height: '800',
          color: 'ffffff',
          mobile_device_brand: cleanBrand,
          mobile_device_model: cleanModel,
          mobile_device_color: 'black' // Default to black, most common
        });
        
        return `https://images.daisycon.io/mobile-device/?${params.toString()}`;
      },
      requiresValidation: false // Daisycon always returns an image (placeholder if not found)
    },
    {
      name: 'high_quality_placeholder',
      priority: 3,
      getImageUrl: (manufacturer: string, model: string) => {
        // Use Unsplash for better quality placeholder with phone/tech theme
        const randomSeed = model.replace(/\s+/g, '').toLowerCase();
        return `https://source.unsplash.com/800x600/?smartphone,${manufacturer.toLowerCase()},technology&sig=${randomSeed}`;
      },
      requiresValidation: false
    },
    {
      name: 'text_placeholder',
      priority: 4,
      getImageUrl: (manufacturer: string, model: string) => {
        // High quality text-based placeholder as last resort
        const text = model.replace(/Apple\s*/i, '').replace(/Samsung Galaxy\s*/i, '').trim();
        // Use a gradient background that matches your brand
        return `https://via.placeholder.com/800x600/0094CA/ffffff?text=${encodeURIComponent(text)}`;
      },
      requiresValidation: false
    }
  ];

  constructor() {
    this.deviceImageService = new DeviceImageService();
  }

  /**
   * Validate if an image URL is accessible and returns an image
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      // Try GET instead of HEAD as some servers don't support HEAD
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(8000), // 8 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Check if response is OK
      if (!response.ok) {
        console.log(`URL returned ${response.status}: ${url}`);
        return false;
      }
      
      // Check content type - be more lenient
      const contentType = response.headers.get('content-type');
      const isImage = contentType ? 
        (contentType.includes('image') || contentType.includes('octet-stream')) : 
        true; // If no content-type, assume it might be an image
      
      // Also check content length to ensure it's not empty
      const contentLength = response.headers.get('content-length');
      const hasContent = !contentLength || parseInt(contentLength) > 1000; // At least 1KB
      
      return isImage && hasContent;
    } catch (error: any) {
      // Don't log timeout errors as they're common
      if (!error.name?.includes('Timeout')) {
        console.log(`Failed to validate ${url}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Search MobileAPI for device and get image
   */
  private async searchMobileApi(manufacturer: string, model: string): Promise<string | null> {
    try {
      // Clean up the search query
      const searchQuery = `${manufacturer} ${model}`
        .replace(/\s+/g, ' ')
        .trim();
      
      const url = `https://mobileapi.dev/devices/search/?name=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${this.mobileApiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        console.log(`MobileAPI search failed with status ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      // Check if we got results
      if (data && data.results && data.results.length > 0) {
        // Get the first matching device
        const device = data.results[0];
        
        // Check for image in the device data
        if (device.images && device.images.length > 0) {
          // Return the first image URL
          const imageUrl = device.images[0];
          console.log(`✓ Found image from MobileAPI for ${searchQuery}`);
          return imageUrl;
        }
        
        // If device has an ID but no images in search, fetch full details
        if (device.id) {
          const detailUrl = `https://mobileapi.dev/devices/${device.id}/`;
          const detailResponse = await fetch(detailUrl, {
            headers: {
              'Authorization': `Token ${this.mobileApiKey}`
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.images && detailData.images.length > 0) {
              console.log(`✓ Found image from MobileAPI details for ${searchQuery}`);
              return detailData.images[0];
            }
          }
        }
      }
      
      console.log(`No results from MobileAPI for ${searchQuery}`);
      return null;
    } catch (error) {
      console.log(`MobileAPI search error:`, error);
      return null;
    }
  }

  /**
   * Find the best available image URL for a device
   */
  private async findBestImageUrl(manufacturer: string, model: string): Promise<string | null> {
    // First, try MobileAPI for the most accurate image
    const mobileApiImage = await this.searchMobileApi(manufacturer, model);
    if (mobileApiImage) {
      return mobileApiImage;
    }
    
    // Then try other sources
    for (const source of this.imageSources) {
      const url = source.getImageUrl(manufacturer, model);
      
      if (!url) continue;
      
      // If validation is required, check if the URL is accessible
      if (source.requiresValidation) {
        console.log(`Trying ${source.name} for ${model}: ${url}`);
        const isValid = await this.validateImageUrl(url);
        if (isValid) {
          console.log(`✓ Found valid image from ${source.name}`);
          return url;
        } else {
          console.log(`✗ ${source.name} image not available`);
        }
      } else {
        // No validation required (e.g., Daisycon always returns something)
        console.log(`✓ Using ${source.name} for ${model}`);
        return url;
      }
    }
    
    return null;
  }

  /**
   * Download and store image in Supabase Storage
   */
  private async downloadAndStoreImage(
    imageUrl: string, 
    deviceId: string, 
    deviceName: string
  ): Promise<string | null> {
    try {
      console.log(`Downloading image for ${deviceName}...`);
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      // Create a clean filename
      const cleanName = deviceName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      const fileName = `${deviceId}-${cleanName}.jpg`;
      
      // Convert blob to File
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('device-images')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '31536000', // Cache for 1 year
          contentType: 'image/jpeg'
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('device-images')
        .getPublicUrl(fileName);
      
      console.log(`✓ Stored image for ${deviceName}: ${publicUrl}`);
      return publicUrl;
      
    } catch (error) {
      console.error(`Failed to store image for ${deviceName}:`, error);
      return null;
    }
  }

  /**
   * Populate images for all devices without images
   */
  async populateAllDeviceImages(options: {
    limit?: number;
    onProgress?: (current: number, total: number, device: string) => void;
  } = {}) {
    const { limit, onProgress } = options;
    
    // Initialize the storage bucket
    await this.deviceImageService.initializeBucket();
    
    // Get all devices without images
    const { data: devices, error } = await this.supabase
      .from('devices')
      .select(`
        id,
        model_name,
        image_url,
        thumbnail_url,
        manufacturers!inner (
          name
        )
      `)
      .is('image_url', null)
      .order('model_name')
      .limit(limit || 1000);
    
    if (error) {
      console.error('Failed to fetch devices:', error);
      return { success: false, error };
    }
    
    if (!devices || devices.length === 0) {
      console.log('No devices without images found');
      return { success: true, updated: 0 };
    }
    
    console.log(`Found ${devices.length} devices without images`);
    
    const results = {
      total: devices.length,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process each device
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const manufacturer = device.manufacturers?.name || 'Unknown';
      const deviceName = `${manufacturer} ${device.model_name}`;
      
      if (onProgress) {
        onProgress(i + 1, devices.length, deviceName);
      }
      
      console.log(`\nProcessing ${i + 1}/${devices.length}: ${deviceName}`);
      
      try {
        // Find the best available image
        const imageUrl = await this.findBestImageUrl(manufacturer, device.model_name);
        
        if (!imageUrl) {
          console.log(`✗ No image source found for ${deviceName}`);
          results.failed++;
          results.errors.push(`No image found for ${deviceName}`);
          continue;
        }
        
        // Download and store in Supabase
        const storedUrl = await this.downloadAndStoreImage(
          imageUrl, 
          device.id, 
          device.model_name
        );
        
        if (!storedUrl) {
          console.log(`✗ Failed to store image for ${deviceName}`);
          results.failed++;
          results.errors.push(`Failed to store image for ${deviceName}`);
          continue;
        }
        
        // Update the device record
        const { error: updateError } = await this.supabase
          .from('devices')
          .update({
            image_url: storedUrl,
            thumbnail_url: storedUrl, // Use same URL for now, could generate smaller version
            updated_at: new Date().toISOString()
          })
          .eq('id', device.id);
        
        if (updateError) {
          console.error(`Failed to update device ${deviceName}:`, updateError);
          results.failed++;
          results.errors.push(`Failed to update ${deviceName}: ${updateError.message}`);
        } else {
          console.log(`✓ Successfully updated ${deviceName}`);
          results.updated++;
        }
        
      } catch (error) {
        console.error(`Error processing ${deviceName}:`, error);
        results.failed++;
        results.errors.push(`Error processing ${deviceName}: ${error}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== Population Complete ===');
    console.log(`Total: ${results.total}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Failed: ${results.failed}`);
    
    return results;
  }

  /**
   * Populate image for a single device
   */
  async populateDeviceImage(deviceId: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    // Get device details
    const { data: device, error } = await this.supabase
      .from('devices')
      .select(`
        id,
        model_name,
        manufacturers!inner (
          name
        )
      `)
      .eq('id', deviceId)
      .single();
    
    if (error || !device) {
      return { success: false, error: 'Device not found' };
    }
    
    const manufacturer = device.manufacturers?.name || 'Unknown';
    const deviceName = `${manufacturer} ${device.model_name}`;
    
    // Find and store image
    const imageUrl = await this.findBestImageUrl(manufacturer, device.model_name);
    if (!imageUrl) {
      return { success: false, error: 'No image source found' };
    }
    
    const storedUrl = await this.downloadAndStoreImage(imageUrl, device.id, device.model_name);
    if (!storedUrl) {
      return { success: false, error: 'Failed to store image' };
    }
    
    // Update device record
    const { error: updateError } = await this.supabase
      .from('devices')
      .update({
        image_url: storedUrl,
        thumbnail_url: storedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true, imageUrl: storedUrl };
  }
}