/**
 * Device image URL patterns from various sources
 * These can be used as fallbacks or primary sources
 */

export const DEVICE_IMAGE_SOURCES = {
  // Apple devices - using Apple's official images
  apple: (model: string) => {
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
    return `https://www.apple.com/newsroom/images/${modelSlug}-hero.jpg`;
  },
  
  // Generic device image API
  deviceSpecs: (brand: string, model: string) => {
    const query = `${brand} ${model}`.replace(/\s+/g, '+');
    return `https://fdn2.gsmarena.com/vv/bigpic/${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  },
  
  // Placeholder service for missing images
  placeholder: (brand: string, model: string) => {
    return `https://via.placeholder.com/400x400/1e293b/ffffff?text=${encodeURIComponent(`${brand} ${model}`)}`;
  },
  
  // Your own CDN (if you set one up)
  cdn: (fileName: string) => {
    // Could be Cloudinary, AWS S3, etc.
    return `https://your-cdn.com/device-images/${fileName}`;
  }
};

/**
 * Get the best available image URL for a device
 */
export function getDeviceImageUrl(
  brand: string, 
  model: string, 
  storedUrl?: string | null
): string {
  // If we have a stored URL, use it
  if (storedUrl) {
    // If it's a relative URL, it needs to be handled differently in production
    if (storedUrl.startsWith('/images/')) {
      // In production, these should be migrated to Supabase or CDN
      return storedUrl;
    }
    return storedUrl;
  }
  
  // Try to get from known sources based on brand
  const brandLower = brand.toLowerCase();
  
  if (brandLower === 'apple' || brandLower === 'iphone') {
    return DEVICE_IMAGE_SOURCES.apple(model);
  }
  
  // For other brands, try device specs API
  if (['samsung', 'google', 'xiaomi', 'oneplus'].includes(brandLower)) {
    return DEVICE_IMAGE_SOURCES.deviceSpecs(brand, model);
  }
  
  // Fallback to placeholder
  return DEVICE_IMAGE_SOURCES.placeholder(brand, model);
}

/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}