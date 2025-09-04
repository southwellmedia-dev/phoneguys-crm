/**
 * Script to migrate device images to Supabase Storage
 * Run this locally before deploying to Vercel
 * 
 * Usage: npx tsx scripts/migrate-device-images.ts
 */

// Load environment variables for local development
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createServiceClient } from '@/lib/supabase/service';
import { DeviceImageService } from '@/lib/services/device-image.service';
import fs from 'fs/promises';
import path from 'path';

async function migrateDeviceImages() {
  console.log('🚀 Starting device image migration to Supabase Storage...\n');
  
  const supabase = createServiceClient();
  const imageService = new DeviceImageService();
  
  try {
    // 1. Initialize bucket
    console.log('📦 Initializing storage bucket...');
    await imageService.initializeBucket();
    
    // 2. Get all devices from database
    console.log('📋 Fetching devices from database...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, model_name, manufacturer:manufacturers(name), image_url')
      .order('model_name');
    
    if (devicesError) throw devicesError;
    if (!devices || devices.length === 0) {
      console.log('No devices found in database');
      return;
    }
    
    console.log(`Found ${devices.length} devices\n`);
    
    // 3. Read local images directory and subdirectories
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'devices');
    const imageMap = new Map<string, string>(); // filename -> full path
    
    try {
      // Read main directory
      const items = await fs.readdir(imagesDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          // Read subdirectory
          const subDir = path.join(imagesDir, item.name);
          const subItems = await fs.readdir(subDir);
          
          for (const file of subItems) {
            if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
              imageMap.set(file.toLowerCase(), path.join(subDir, file));
            }
          }
        } else if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
          // Main directory files
          imageMap.set(item.name.toLowerCase(), path.join(imagesDir, item.name));
        }
      }
      
      console.log(`Found ${imageMap.size} total images across all folders\n`);
    } catch (error) {
      console.log('Error reading images directory:', error);
      return;
    }
    
    // 4. Process each device
    const results = {
      uploaded: [] as any[],
      skipped: [] as any[],
      failed: [] as any[],
      noImage: [] as any[]
    };
    
    for (const device of devices) {
      const deviceName = `${device.manufacturer?.name || 'Unknown'} ${device.model_name}`;
      
      // Skip if already has a Supabase URL
      if (device.image_url?.includes('supabase')) {
        console.log(`⏭️  Skipping ${deviceName} (already on Supabase)`);
        results.skipped.push(device);
        continue;
      }
      
      // Create various possible filenames
      const modelClean = device.model_name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
      
      const brandClean = (device.manufacturer?.name || '').toLowerCase();
      
      // Try different filename patterns
      const possibleNames = [
        `${brandClean}-${modelClean}.png`,
        `${brandClean}-${modelClean}.jpg`,
        `${modelClean}.png`,
        `${modelClean}.jpg`,
        `${brandClean}-${device.model_name.toLowerCase().replace(/\s+/g, '-')}.png`,
        `${brandClean}-${device.model_name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      ];
      
      let imagePath: string | undefined;
      let matchingFilename: string | undefined;
      
      for (const possibleName of possibleNames) {
        if (imageMap.has(possibleName)) {
          imagePath = imageMap.get(possibleName);
          matchingFilename = possibleName;
          break;
        }
      }
      
      if (imagePath && matchingFilename) {
        try {
          console.log(`📤 Uploading ${deviceName} (${matchingFilename})...`);
          
          // Read the image file
          const imageBuffer = await fs.readFile(imagePath);
          const mimeType = matchingFilename.endsWith('.png') ? 'image/png' : 'image/jpeg';
          const imageBlob = new Blob([imageBuffer], { type: mimeType });
          const imageFile = new File([imageBlob], matchingFilename, { type: mimeType });
          
          // Upload to Supabase with organized path
          const publicUrl = await imageService.uploadDeviceImage(imageFile, device.model_name);
          
          // Update database with new URL
          const { error: updateError } = await supabase
            .from('devices')
            .update({ image_url: publicUrl })
            .eq('id', device.id);
          
          if (updateError) throw updateError;
          
          console.log(`✅ Uploaded ${deviceName}`);
          results.uploaded.push({ ...device, new_url: publicUrl });
          
        } catch (error) {
          console.error(`❌ Failed to upload ${deviceName}:`, error);
          results.failed.push({ ...device, error });
        }
      } else {
        console.log(`⚠️  No image found for ${deviceName}`);
        results.noImage.push(device);
      }
    }
    
    // 5. Upload any remaining images not matched to devices (brand images, etc.)
    console.log('\n📤 Uploading unmatched images for gallery...');
    const uploadedFiles = new Set(results.uploaded.map(r => r.matchingFilename));
    
    for (const [filename, filepath] of imageMap.entries()) {
      if (!uploadedFiles.has(filename)) {
        try {
          const imageBuffer = await fs.readFile(filepath);
          const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
          const imageBlob = new Blob([imageBuffer], { type: mimeType });
          const imageFile = new File([imageBlob], filename, { type: mimeType });
          
          // Upload with generic name
          const cleanName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
          await imageService.uploadDeviceImage(imageFile, cleanName);
          console.log(`✅ Uploaded additional image: ${filename}`);
        } catch (error) {
          console.log(`⚠️  Failed to upload ${filename}:`, error);
        }
      }
    }
    
    // 6. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Uploaded: ${results.uploaded.length} device images`);
    console.log(`⏭️  Skipped: ${results.skipped.length} devices (already on Supabase)`);
    console.log(`⚠️  No image: ${results.noImage.length} devices`);
    console.log(`❌ Failed: ${results.failed.length} uploads`);
    
    if (results.noImage.length > 0) {
      console.log('\nDevices without images:');
      results.noImage.slice(0, 10).forEach(d => {
        console.log(`  - ${d.manufacturer?.name} ${d.model_name}`);
      });
      if (results.noImage.length > 10) {
        console.log(`  ... and ${results.noImage.length - 10} more`);
      }
    }
    
    if (results.failed.length > 0) {
      console.log('\nFailed uploads:');
      results.failed.forEach(f => {
        console.log(`  - ${f.manufacturer?.name} ${f.model_name}`);
      });
    }
    
    console.log('\n✨ Migration complete!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDeviceImages();