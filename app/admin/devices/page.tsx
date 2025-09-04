import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { DeviceRepository } from "@/lib/repositories/device.repository";
import { DeviceImageService } from "@/lib/services/device-image.service";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DevicesClient } from "./devices-client";

export const metadata: Metadata = {
  title: "Device Management",
  description: "Manage device database and specifications",
};

// Server action to fetch media gallery images
async function fetchMediaGallery(searchTerm: string = '', limit: number = 50) {
  'use server';
  
  try {
    const serviceClient = createServiceClient();
    
    // List all files in the device-images bucket
    const { data: files, error } = await serviceClient.storage
      .from('device-images')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to fetch images: ${error.message}`);
    }

    if (!files) {
      return { success: true, data: [] };
    }

    // Filter files by search term if provided
    let filteredFiles = files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit results
    filteredFiles = filteredFiles.slice(0, limit);

    // Get public URLs for the filtered files
    const filesWithUrls = filteredFiles.map(file => {
      const { data: { publicUrl } } = serviceClient.storage
        .from('device-images')
        .getPublicUrl(file.name);

      return {
        id: file.id || file.name,
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
      };
    });

    return { success: true, data: filesWithUrls };
  } catch (error) {
    console.error('Error fetching media gallery:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch media gallery' 
    };
  }
}

// Server action to upload device image
async function uploadDeviceImage(formData: FormData) {
  'use server';
  
  try {
    const file = formData.get('file') as File;
    const deviceId = formData.get('deviceId') as string;
    const deviceName = formData.get('deviceName') as string;

    if (!file || !deviceId || !deviceName) {
      return { success: false, error: 'Missing required data' };
    }

    // Upload image
    const imageService = new DeviceImageService();
    const imageUrl = await imageService.uploadDeviceImage(file, deviceName);

    // Update device in database
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: imageUrl,
      thumbnail_url: imageUrl
    });

    revalidatePath('/admin/devices');
    return { success: true, data: { device: updatedDevice, imageUrl } };
  } catch (error) {
    console.error('Error uploading device image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload image' 
    };
  }
}

// Server action to select image from gallery
async function selectDeviceImage(deviceId: string, imageUrl: string) {
  'use server';
  
  try {
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: imageUrl,
      thumbnail_url: imageUrl
    });

    revalidatePath('/admin/devices');
    return { success: true, data: { device: updatedDevice } };
  } catch (error) {
    console.error('Error selecting device image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to select image' 
    };
  }
}

// Server action to remove device image
async function removeDeviceImage(deviceId: string) {
  'use server';
  
  try {
    const deviceRepo = new DeviceRepository();
    const updatedDevice = await deviceRepo.update(deviceId, {
      image_url: null,
      thumbnail_url: null
    });

    revalidatePath('/admin/devices');
    return { success: true, data: { device: updatedDevice } };
  } catch (error) {
    console.error('Error removing device image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove image' 
    };
  }
}

// Server action to upload image to gallery (without assigning to device)
async function uploadToGallery(file: File) {
  'use server';
  
  try {
    const imageService = new DeviceImageService();
    const imageUrl = await imageService.uploadDeviceImage(file, `gallery-${Date.now()}`);

    return { success: true, data: { url: imageUrl } };
  } catch (error) {
    console.error('Error uploading to gallery:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload image' 
    };
  }
}

export default async function DevicesPage() {
  const deviceRepo = new DeviceRepository();
  const devices = await deviceRepo.getActiveDevices();

  // Fetch manufacturers for the device form
  const supabase = await createClient();
  const { data: manufacturers } = await supabase
    .from('manufacturers')
    .select('id, name')
    .order('name');

  return (
    <DevicesClient 
      initialDevices={devices} 
      manufacturers={manufacturers || []}
      fetchMediaGallery={fetchMediaGallery}
      uploadDeviceImage={uploadDeviceImage}
      selectDeviceImage={selectDeviceImage}
      removeDeviceImage={removeDeviceImage}
      uploadToGallery={uploadToGallery}
    />
  );
}