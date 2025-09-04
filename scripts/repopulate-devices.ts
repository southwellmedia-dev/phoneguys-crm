import { config } from 'dotenv';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';
import { createServiceClient } from '../lib/supabase/service';

// Load environment variables
config({ path: '.env.local' });

interface DeviceData {
  manufacturer: string;
  model: string;
  imagePath: string;
}

const deviceData: DeviceData[] = [
  // iPhones
  { manufacturer: 'Apple', model: 'iPhone 15 Pro Max', imagePath: '/images/devices/iphone/iphone-15-pro-max.png' },
  { manufacturer: 'Apple', model: 'iPhone 15 Pro', imagePath: '/images/devices/iphone/iphone-15-pro.png' },
  { manufacturer: 'Apple', model: 'iPhone 15 Plus', imagePath: '/images/devices/iphone/iphone-15-plus.png' },
  { manufacturer: 'Apple', model: 'iPhone 15', imagePath: '/images/devices/iphone/iphone-15.png' },
  { manufacturer: 'Apple', model: 'iPhone 14 Pro Max', imagePath: '/images/devices/iphone/iphone-14-pro-max.png' },
  { manufacturer: 'Apple', model: 'iPhone 14 Pro', imagePath: '/images/devices/iphone/iphone-14-pro.png' },
  { manufacturer: 'Apple', model: 'iPhone 14 Plus', imagePath: '/images/devices/iphone/iphone-14-plus.png' },
  { manufacturer: 'Apple', model: 'iPhone 14', imagePath: '/images/devices/iphone/iphone-14.png' },
  { manufacturer: 'Apple', model: 'iPhone 13 Pro Max', imagePath: '/images/devices/iphone/iphone-13-pro-max.png' },
  { manufacturer: 'Apple', model: 'iPhone 13 Pro', imagePath: '/images/devices/iphone/iphone-13-pro.png' },
  { manufacturer: 'Apple', model: 'iPhone 13', imagePath: '/images/devices/iphone/iphone-13.png' },
  { manufacturer: 'Apple', model: 'iPhone 13 Mini', imagePath: '/images/devices/iphone/iphone-13-mini.png' },
  { manufacturer: 'Apple', model: 'iPhone 12 Pro Max', imagePath: '/images/devices/iphone/iphone-12-pro-max.png' },
  { manufacturer: 'Apple', model: 'iPhone 12 Pro', imagePath: '/images/devices/iphone/iphone-12-pro.png' },
  { manufacturer: 'Apple', model: 'iPhone 12', imagePath: '/images/devices/iphone/iphone-12.png' },
  { manufacturer: 'Apple', model: 'iPhone 12 Mini', imagePath: '/images/devices/iphone/iphone-12-mini.png' },
  { manufacturer: 'Apple', model: 'iPhone 11 Pro Max', imagePath: '/images/devices/iphone/iphone-11-pro-max.png' },
  { manufacturer: 'Apple', model: 'iPhone 11 Pro', imagePath: '/images/devices/iphone/iphone-11-pro.png' },
  { manufacturer: 'Apple', model: 'iPhone 11', imagePath: '/images/devices/iphone/iphone-11.png' },
  { manufacturer: 'Apple', model: 'iPhone SE 3rd Gen', imagePath: '/images/devices/iphone/iphone-se-3rd-gen.png' },
  { manufacturer: 'Apple', model: 'iPhone SE 2nd Gen', imagePath: '/images/devices/iphone/iphone-se-2020.png' },
  { manufacturer: 'Apple', model: 'iPhone XS Max', imagePath: '/images/devices/iphone/iphone-xs-max.png' },
  { manufacturer: 'Apple', model: 'iPhone XS', imagePath: '/images/devices/iphone/iphone-xs.png' },
  { manufacturer: 'Apple', model: 'iPhone XR', imagePath: '/images/devices/iphone/iphone-xr.png' },
  { manufacturer: 'Apple', model: 'iPhone X', imagePath: '/images/devices/iphone/iphone-x.png' },
  
  // iPads
  { manufacturer: 'Apple', model: 'iPad Pro 12.9" (6th Gen)', imagePath: '/images/devices/ipad/ipad-pro-12-9-2022.png' },
  { manufacturer: 'Apple', model: 'iPad Pro 11" (4th Gen)', imagePath: '/images/devices/ipad/ipad-pro-11-2022.png' },
  { manufacturer: 'Apple', model: 'iPad Air (5th Gen)', imagePath: '/images/devices/ipad/ipad-air-5.png' },
  { manufacturer: 'Apple', model: 'iPad (10th Gen)', imagePath: '/images/devices/ipad/ipad-10.png' },
  { manufacturer: 'Apple', model: 'iPad (9th Gen)', imagePath: '/images/devices/ipad/ipad-9.png' },
  { manufacturer: 'Apple', model: 'iPad Mini (6th Gen)', imagePath: '/images/devices/ipad/ipad-mini-6.png' },
  
  // Samsung phones
  { manufacturer: 'Samsung', model: 'Galaxy S24 Ultra', imagePath: '/images/devices/samsung/galaxy-s24-ultra.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S24+', imagePath: '/images/devices/samsung/galaxy-s24-plus.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S24', imagePath: '/images/devices/samsung/galaxy-s24.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S23 Ultra', imagePath: '/images/devices/samsung/galaxy-s23-ultra.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S23+', imagePath: '/images/devices/samsung/galaxy-s23-plus.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S23', imagePath: '/images/devices/samsung/galaxy-s23.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S22 Ultra', imagePath: '/images/devices/samsung/galaxy-s22-ultra.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S22+', imagePath: '/images/devices/samsung/galaxy-s22-plus.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S22', imagePath: '/images/devices/samsung/galaxy-s22.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S21 Ultra', imagePath: '/images/devices/samsung/galaxy-s21-ultra.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S21+', imagePath: '/images/devices/samsung/galaxy-s21-plus.png' },
  { manufacturer: 'Samsung', model: 'Galaxy S21', imagePath: '/images/devices/samsung/galaxy-s21.png' },
  { manufacturer: 'Samsung', model: 'Galaxy Z Fold 5', imagePath: '/images/devices/samsung/galaxy-z-fold-5.png' },
  { manufacturer: 'Samsung', model: 'Galaxy Z Flip 5', imagePath: '/images/devices/samsung/galaxy-z-flip-5.png' },
  { manufacturer: 'Samsung', model: 'Galaxy A54', imagePath: '/images/devices/samsung/galaxy-a54.png' },
  { manufacturer: 'Samsung', model: 'Galaxy A34', imagePath: '/images/devices/samsung/galaxy-a34.png' },
  { manufacturer: 'Samsung', model: 'Galaxy A14', imagePath: '/images/devices/samsung/galaxy-a14.png' },
  
  // Google Pixel
  { manufacturer: 'Google', model: 'Pixel 8 Pro', imagePath: '/images/devices/google/pixel-8-pro.png' },
  { manufacturer: 'Google', model: 'Pixel 8', imagePath: '/images/devices/google/pixel-8.png' },
  { manufacturer: 'Google', model: 'Pixel 7 Pro', imagePath: '/images/devices/google/pixel-7-pro.png' },
  { manufacturer: 'Google', model: 'Pixel 7', imagePath: '/images/devices/google/pixel-7.png' },
  { manufacturer: 'Google', model: 'Pixel 7a', imagePath: '/images/devices/google/pixel-7a.png' },
  { manufacturer: 'Google', model: 'Pixel 6 Pro', imagePath: '/images/devices/google/25-05-2022-1653481380pixel-6-pro.png' },
  { manufacturer: 'Google', model: 'Pixel 6', imagePath: '/images/devices/google/25-05-2022-1653481364pixel-6.png' },
  { manufacturer: 'Google', model: 'Pixel 6a', imagePath: '/images/devices/google/pixel-6a.png' },
  { manufacturer: 'Google', model: 'Pixel 5a', imagePath: '/images/devices/google/25-05-2022-1653481348pixel-5a.png' },
  { manufacturer: 'Google', model: 'Pixel 5', imagePath: '/images/devices/google/25-05-2022-1653481311pixel-5.png' },
  { manufacturer: 'Google', model: 'Pixel 4a', imagePath: '/images/devices/google/25-05-2022-1653481274pixel-4a.png' },
  { manufacturer: 'Google', model: 'Pixel 4 XL', imagePath: '/images/devices/google/25-05-2022-1653481206pixel-4-xl.png' },
  
  // OnePlus
  { manufacturer: 'OnePlus', model: 'OnePlus 12', imagePath: '/images/devices/oneplus/oneplus-12.png' },
  { manufacturer: 'OnePlus', model: 'OnePlus 11', imagePath: '/images/devices/oneplus/oneplus-11.png' },
  { manufacturer: 'OnePlus', model: 'OnePlus Nord 3', imagePath: '/images/devices/oneplus/oneplus-nord-3.png' },
  { manufacturer: 'OnePlus', model: 'OnePlus 10 Pro', imagePath: '/images/devices/oneplus/oneplus-10-pro.png' },
  { manufacturer: 'OnePlus', model: 'OnePlus 10T', imagePath: '/images/devices/oneplus/oneplus-10t.png' },
];

async function repopulateDevices() {
  console.log('🚀 Starting device repopulation...');
  
  const supabase = createServiceClient();
  
  try {
    // First, create manufacturers
    const manufacturers = [...new Set(deviceData.map(d => d.manufacturer))];
    console.log(`\n📦 Creating ${manufacturers.length} manufacturers...`);
    
    for (const manufacturerName of manufacturers) {
      const { data: existingManufacturer } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('name', manufacturerName)
        .single();
      
      if (!existingManufacturer) {
        const { error } = await supabase
          .from('manufacturers')
          .insert({
            name: manufacturerName,
            is_active: true,
          });
        
        if (error) {
          console.error(`Error creating manufacturer ${manufacturerName}:`, error);
        } else {
          console.log(`✅ Created manufacturer: ${manufacturerName}`);
        }
      }
    }
    
    // Get all manufacturers
    const { data: allManufacturers } = await supabase
      .from('manufacturers')
      .select('id, name');
    
    const manufacturerMap = new Map(allManufacturers?.map(m => [m.name, m.id]) || []);
    
    // Now create devices
    console.log(`\n📱 Creating ${deviceData.length} devices...`);
    
    for (const device of deviceData) {
      const manufacturerId = manufacturerMap.get(device.manufacturer);
      
      if (!manufacturerId) {
        console.error(`Manufacturer not found: ${device.manufacturer}`);
        continue;
      }
      
      // Extract device info from model name
      const deviceType = device.model.toLowerCase().includes('ipad') ? 'tablet' : 'smartphone';
      const releaseYear = extractYear(device.model);
      
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('manufacturer_id', manufacturerId)
        .eq('model_name', device.model)
        .single();
      
      if (!existingDevice) {
        const { error } = await supabase
          .from('devices')
          .insert({
            manufacturer_id: manufacturerId,
            model_name: device.model,
            device_type: deviceType,
            release_year: releaseYear,
            image_url: device.imagePath,
            is_active: true,
            parts_availability: releaseYear && releaseYear >= 2020 ? 'available' : 'limited',
          });
        
        if (error) {
          console.error(`Error creating device ${device.model}:`, error);
        } else {
          console.log(`✅ Created device: ${device.manufacturer} ${device.model}`);
        }
      }
    }
    
    // Add some sample services
    console.log('\n🔧 Creating sample services...');
    const services = [
      { name: 'Screen Replacement', category: 'screen', base_price: 150, description: 'Replace cracked or broken screen' },
      { name: 'Battery Replacement', category: 'battery', base_price: 80, description: 'Replace old or faulty battery' },
      { name: 'Charging Port Repair', category: 'charging', base_price: 90, description: 'Fix charging port issues' },
      { name: 'Camera Repair', category: 'camera', base_price: 120, description: 'Repair or replace camera module' },
      { name: 'Water Damage Repair', category: 'water_damage', base_price: 200, description: 'Clean and repair water damaged device' },
      { name: 'Speaker Repair', category: 'audio', base_price: 70, description: 'Fix speaker or audio issues' },
      { name: 'Microphone Repair', category: 'audio', base_price: 70, description: 'Repair microphone problems' },
      { name: 'Button Repair', category: 'physical', base_price: 60, description: 'Fix power or volume buttons' },
      { name: 'Back Glass Replacement', category: 'cosmetic', base_price: 100, description: 'Replace broken back glass' },
      { name: 'Software Troubleshooting', category: 'software', base_price: 50, description: 'Fix software related issues' },
      { name: 'Data Recovery', category: 'software', base_price: 150, description: 'Recover lost data from device' },
      { name: 'Motherboard Repair', category: 'motherboard', base_price: 250, description: 'Complex motherboard level repair' },
    ];
    
    for (const service of services) {
      const { data: existingService } = await supabase
        .from('services')
        .select('id')
        .eq('name', service.name)
        .single();
      
      if (!existingService) {
        const { error } = await supabase
          .from('services')
          .insert({
            ...service,
            is_active: true,
            average_duration_minutes: 60,
          });
        
        if (error) {
          console.error(`Error creating service ${service.name}:`, error);
        } else {
          console.log(`✅ Created service: ${service.name}`);
        }
      }
    }
    
    console.log('\n✨ Device repopulation complete!');
    
  } catch (error) {
    console.error('Error during repopulation:', error);
  }
}

function extractYear(modelName: string): number | null {
  // Try to extract year from model names like "iPhone 15" or "Galaxy S24"
  const currentYear = new Date().getFullYear();
  
  // Check for iPhone models
  if (modelName.includes('iPhone 15')) return 2023;
  if (modelName.includes('iPhone 14')) return 2022;
  if (modelName.includes('iPhone 13')) return 2021;
  if (modelName.includes('iPhone 12')) return 2020;
  if (modelName.includes('iPhone 11')) return 2019;
  if (modelName.includes('iPhone X')) return modelName.includes('XS') || modelName.includes('XR') ? 2018 : 2017;
  if (modelName.includes('iPhone SE 3rd')) return 2022;
  if (modelName.includes('iPhone SE 2nd')) return 2020;
  
  // Samsung Galaxy S series
  if (modelName.includes('Galaxy S24')) return 2024;
  if (modelName.includes('Galaxy S23')) return 2023;
  if (modelName.includes('Galaxy S22')) return 2022;
  if (modelName.includes('Galaxy S21')) return 2021;
  
  // Galaxy Z series
  if (modelName.includes('Z Fold 5') || modelName.includes('Z Flip 5')) return 2023;
  
  // iPad models
  if (modelName.includes('(10th Gen)')) return 2022;
  if (modelName.includes('(9th Gen)')) return 2021;
  if (modelName.includes('(6th Gen)')) return modelName.includes('Mini') ? 2021 : 2022;
  if (modelName.includes('(5th Gen)')) return 2022;
  if (modelName.includes('(4th Gen)')) return 2022;
  
  // Pixel models
  if (modelName.includes('Pixel 8')) return 2023;
  if (modelName.includes('Pixel 7')) return 2022;
  if (modelName.includes('Pixel 6')) return 2021;
  if (modelName.includes('Pixel 5')) return 2020;
  if (modelName.includes('Pixel 4')) return 2019;
  
  // OnePlus
  if (modelName.includes('OnePlus 12')) return 2024;
  if (modelName.includes('OnePlus 11')) return 2023;
  if (modelName.includes('OnePlus 10')) return 2022;
  
  return null;
}

// Run the script
repopulateDevices().catch(console.error);