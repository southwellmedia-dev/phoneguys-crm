import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/admin/devices/fetch-image
 * Fetch image for a single device on demand
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['admin', 'manager']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { deviceId, manufacturer, model } = body;

    console.log('[Fetch Image] Request:', { deviceId, manufacturer, model });

    if (!deviceId || !manufacturer || !model) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // Check if device already has an image
    const { data: device } = await supabase
      .from('devices')
      .select('image_url')
      .eq('id', deviceId)
      .single();
    
    if (device?.image_url) {
      return NextResponse.json({
        success: true,
        imageUrl: device.image_url,
        source: 'existing'
      });
    }

    console.log('[Fetch Image] Trying MobileAPI first...');
    // Try MobileAPI first
    let imageUrl = await fetchFromMobileAPI(manufacturer, model);
    let source = 'mobileapi';
    
    // Fallback to Daisycon
    if (!imageUrl) {
      console.log('[Fetch Image] MobileAPI failed, trying Daisycon...');
      imageUrl = await fetchFromDaisycon(manufacturer, model);
      source = 'daisycon';
    }
    
    if (!imageUrl) {
      // Last resort - text placeholder
      console.log('[Fetch Image] Using placeholder...');
      const text = model.replace(/Apple\s*/i, '').replace(/Samsung Galaxy\s*/i, '').trim();
      imageUrl = `https://via.placeholder.com/800x600/0094CA/ffffff?text=${encodeURIComponent(text)}`;
      source = 'placeholder';
    }

    console.log('[Fetch Image] Got image URL:', imageUrl, 'from:', source);

    // Try to store the image in Supabase Storage
    let finalUrl = imageUrl; // Default to external URL
    let stored = false;
    
    const storedUrl = await downloadAndStore(imageUrl, deviceId, model, supabase);
    
    if (storedUrl) {
      console.log('[Fetch Image] Successfully stored image at:', storedUrl);
      finalUrl = storedUrl;
      stored = true;
    } else {
      console.log('[Fetch Image] Storage failed, using external URL directly');
      // If storage fails, we'll use the external URL directly
    }

    // Update device record with either stored or external URL
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        image_url: finalUrl,
        thumbnail_url: finalUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);
    
    if (updateError) {
      console.error('[Fetch Image] Failed to update device:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update device record'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: finalUrl,
      source,
      stored // Indicates if image was stored locally or using external URL
    });

  } catch (error) {
    console.error('[Device Image] Fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch device image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchFromMobileAPI(manufacturer: string, model: string): Promise<string | null> {
  const apiKey = '55c15cad972f723b3202b6854d0dc7e1e124070f';
  
  try {
    const searchQuery = `${manufacturer} ${model}`.replace(/\s+/g, ' ').trim();
    console.log('[MobileAPI] Searching for:', searchQuery);
    const url = `https://mobileapi.dev/devices/search/?name=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      console.log('[MobileAPI] Search failed with status:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('[MobileAPI] Response:', data);
    
    // MobileAPI returns a single device object, not an array
    if (data && (data.id || data.name)) {
      const device = data;
      console.log('[MobileAPI] Found device:', device.name);
      
      // Check for image_b64 field (base64 encoded image)
      if (device.image_b64) {
        console.log('[MobileAPI] Found base64 image, converting to data URL');
        // Convert base64 to data URL
        return `data:image/jpeg;base64,${device.image_b64}`;
      }
      
      // Check for images array (URLs)
      if (device.images?.length > 0) {
        console.log('[MobileAPI] Found image URL');
        return device.images[0];
      }
      
      // Check for image field
      if (device.image) {
        console.log('[MobileAPI] Found image field');
        return device.image;
      }
    }
    
    console.log('[MobileAPI] No image found in response');
    return null;
  } catch (error: any) {
    console.log('[MobileAPI] Error:', error?.message || error);
    return null;
  }
}

async function fetchFromDaisycon(manufacturer: string, model: string): Promise<string> {
  // Clean up model and brand names
  const cleanModel = model.toLowerCase()
    .replace(/apple\s*/i, '')
    .replace(/samsung\s*/i, '')
    .replace(/google\s*/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();
  
  const cleanBrand = manufacturer.toLowerCase().trim();
  
  // Daisycon always returns an image (placeholder if not found)
  const params = new URLSearchParams({
    width: '800',
    height: '800',
    color: 'ffffff',
    mobile_device_brand: cleanBrand,
    mobile_device_model: cleanModel,
    mobile_device_color: 'black'
  });
  
  return `https://images.daisycon.io/mobile-device/?${params.toString()}`;
}

async function downloadAndStore(
  imageUrl: string,
  deviceId: string,
  deviceName: string,
  supabase: any
): Promise<string | null> {
  try {
    console.log('[Download] Processing image from:', imageUrl.substring(0, 50) + '...');
    
    let blob: Blob;
    
    // Check if it's a data URL (base64)
    if (imageUrl.startsWith('data:')) {
      console.log('[Download] Processing base64 data URL');
      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Create blob from binary data
      blob = new Blob([bytes], { type: 'image/jpeg' });
      console.log('[Download] Converted base64 to blob, size:', blob.size);
    } else {
      // Regular URL, fetch it
      console.log('[Download] Fetching image from URL');
      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        console.error('[Download] Failed to fetch image:', response.status);
        return null;
      }
      
      // Get the image as a blob
      blob = await response.blob();
    }
    
    // Create a clean filename
    const cleanName = deviceName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50); // Limit length
    const fileName = `${deviceId}-${cleanName}.jpg`;
    
    console.log('[Download] Uploading to storage as:', fileName, 'size:', blob.size);
    
    // Convert blob to array buffer for Supabase
    const arrayBuffer = await blob.arrayBuffer();
    
    // Upload to Supabase Storage using arrayBuffer
    const { data, error } = await supabase.storage
      .from('device-images')
      .upload(fileName, arrayBuffer, {
        upsert: true,
        cacheControl: '31536000',
        contentType: blob.type || 'image/jpeg'
      });
    
    if (error) {
      console.error('[Download] Storage upload error:', error);
      
      // If file exists, try to get its URL anyway
      if (error.message?.includes('already exists')) {
        const { data: { publicUrl } } = supabase.storage
          .from('device-images')
          .getPublicUrl(fileName);
        console.log('[Download] File exists, returning existing URL:', publicUrl);
        return publicUrl;
      }
      
      throw error;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('device-images')
      .getPublicUrl(fileName);
    
    console.log('[Download] Successfully stored at:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('[Download] Failed to store image:', error);
    return null;
  }
}