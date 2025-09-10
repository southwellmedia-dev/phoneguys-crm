import { SupabaseClient } from '@supabase/supabase-js';

interface DeviceInfo {
  brand: string;
  model: string;
  name: string;
  release_date?: string;
  image_url?: string;
  colors?: string[];
  storage_sizes?: string[];
  specifications?: {
    display?: string;
    processor?: string;
    camera?: string;
    battery?: string;
    [key: string]: any;
  };
}

export class DeviceSyncService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sync devices from TechSpecs API (has free tier)
   * Documentation: https://techspecs.io/
   */
  async syncFromTechSpecs(apiKey: string) {
    try {
      // Get all Apple devices
      const appleDevices = await this.fetchTechSpecsDevices(apiKey, 'Apple');
      await this.saveDevices(appleDevices);

      // Get all Samsung devices
      const samsungDevices = await this.fetchTechSpecsDevices(apiKey, 'Samsung');
      await this.saveDevices(samsungDevices);

      // Get all Google devices
      const googleDevices = await this.fetchTechSpecsDevices(apiKey, 'Google');
      await this.saveDevices(googleDevices);

      return {
        success: true,
        devicesAdded: appleDevices.length + samsungDevices.length + googleDevices.length
      };
    } catch (error) {
      console.error('Error syncing from TechSpecs:', error);
      throw error;
    }
  }

  private async fetchTechSpecsDevices(apiKey: string, brand: string): Promise<DeviceInfo[]> {
    const response = await fetch(`https://api.techspecs.io/v4/all/products`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        brand: [brand],
        category: ['Smartphones', 'Tablets']
      })
    });

    if (!response.ok) {
      throw new Error(`TechSpecs API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data.items.map((item: any) => ({
      brand: item.brand.name,
      model: item.model,
      name: item.name,
      release_date: item.release_date,
      image_url: item.image?.url,
      specifications: {
        display: item.display?.size,
        processor: item.cpu?.name,
        camera: item.camera?.rear?.resolution,
        battery: item.battery?.capacity
      }
    }));
  }

  /**
   * Sync from a static/manual database of popular devices
   * This is a fallback for when APIs are not available
   */
  async syncPopularDevices() {
    console.log('Starting sync of popular devices...');
    
    // First, let's check what devices already exist
    const { data: existingDevices } = await this.supabase
      .from('devices')
      .select('model_name, brand')
      .limit(1000);
    
    console.log(`Found ${existingDevices?.length || 0} existing devices in database`);
    
    // Log existing device names for debugging
    const existingNames = existingDevices?.map(d => d.model_name) || [];
    console.log('Existing device names:', existingNames);
    
    const popularDevices: DeviceInfo[] = [
      // Brand new 2024/2025 Models that likely won't exist in database
      {
        brand: 'Nothing',
        model: 'Phone (3)',
        name: 'Nothing Phone (3)',
        release_date: '2024-07-15',
        image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=400',
        colors: ['Black', 'White', 'Glyph'],
        storage_sizes: ['128GB', '256GB', '512GB'],
        specifications: {
          display: '6.7" LTPO OLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Triple Camera',
          battery: '5000mAh'
        }
      },
      {
        brand: 'OnePlus',
        model: '13 Pro',
        name: 'OnePlus 13 Pro',
        release_date: '2024-12-10',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Stellar Black', 'Glacial Green', 'Alpine Blue'],
        storage_sizes: ['256GB', '512GB', '1TB'],
        specifications: {
          display: '6.82" QHD+ AMOLED',
          processor: 'Snapdragon 8 Gen 4',
          camera: '50MP Hasselblad Camera',
          battery: '5400mAh'
        }
      },
      {
        brand: 'Xiaomi',
        model: '14 Ultra',
        name: 'Xiaomi 14 Ultra',
        release_date: '2024-02-25',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Black', 'White', 'Titanium', 'Green'],
        storage_sizes: ['256GB', '512GB', '1TB'],
        specifications: {
          display: '6.73" LTPO AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Leica Quad Camera',
          battery: '5300mAh'
        }
      },
      {
        brand: 'ASUS',
        model: 'ROG Phone 8 Pro',
        name: 'ASUS ROG Phone 8 Pro',
        release_date: '2024-01-16',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Phantom Black', 'Storm White'],
        storage_sizes: ['512GB', '1TB'],
        specifications: {
          display: '6.78" 165Hz AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Gimbal Camera',
          battery: '5500mAh'
        }
      },
      {
        brand: 'Sony',
        model: 'Xperia 1 VI',
        name: 'Sony Xperia 1 VI',
        release_date: '2024-06-10',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Black', 'Platinum Silver', 'Khaki Green', 'Scarlet'],
        storage_sizes: ['256GB', '512GB'],
        specifications: {
          display: '6.5" 4K HDR OLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '48MP Zeiss Triple Camera',
          battery: '5000mAh'
        }
      },
      {
        brand: 'Motorola',
        model: 'Razr 50 Ultra',
        name: 'Motorola Razr 50 Ultra',
        release_date: '2024-06-25',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Midnight Blue', 'Spring Green', 'Peach Fuzz'],
        storage_sizes: ['256GB', '512GB'],
        specifications: {
          display: '6.9" Foldable pOLED',
          processor: 'Snapdragon 8s Gen 3',
          camera: '50MP Dual Camera',
          battery: '4000mAh'
        }
      },
      {
        brand: 'Honor',
        model: 'Magic6 Pro',
        name: 'Honor Magic6 Pro',
        release_date: '2024-01-11',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Black', 'Epi Green', 'Cyan'],
        storage_sizes: ['256GB', '512GB', '1TB'],
        specifications: {
          display: '6.8" LTPO OLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '180MP Periscope Camera',
          battery: '5600mAh'
        }
      },
      {
        brand: 'Oppo',
        model: 'Find X7 Ultra',
        name: 'Oppo Find X7 Ultra',
        release_date: '2024-01-08',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Ocean Blue', 'Sepia Brown', 'Tailored Black'],
        storage_sizes: ['256GB', '512GB'],
        specifications: {
          display: '6.82" LTPO AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Dual Periscope',
          battery: '5000mAh'
        }
      },
      {
        brand: 'Vivo',
        model: 'X100 Pro',
        name: 'Vivo X100 Pro',
        release_date: '2024-01-04',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Starlight Black', 'Sunset Orange', 'Asteroid Blue'],
        storage_sizes: ['256GB', '512GB', '1TB'],
        specifications: {
          display: '6.78" LTPO AMOLED',
          processor: 'Dimensity 9300',
          camera: '50MP Zeiss APO Camera',
          battery: '5400mAh'
        }
      },
      {
        brand: 'Realme',
        model: 'GT6 Pro',
        name: 'Realme GT6 Pro',
        release_date: '2024-07-09',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        colors: ['Snow Mountain', 'Light Year', 'Iron Gray'],
        storage_sizes: ['256GB', '512GB'],
        specifications: {
          display: '6.78" AMOLED',
          processor: 'Snapdragon 8 Gen 3',
          camera: '50MP Sony LYT-808',
          battery: '5500mAh'
        }
      },
      // iPhones
      {
        brand: 'Apple',
        model: 'iPhone 16 Pro Max',
        name: 'iPhone 16 Pro Max',
        release_date: '2024-09-20',
        image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558',
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium', 'Desert Titanium'],
        storage_sizes: ['256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 16 Pro',
        name: 'iPhone 16 Pro',
        release_date: '2024-09-20',
        image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558',
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium', 'Desert Titanium'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 16',
        name: 'iPhone 16',
        release_date: '2024-09-20',
        image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558',
        colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 16 Plus',
        name: 'iPhone 16 Plus',
        release_date: '2024-09-20',
        image_url: 'https://images.unsplash.com/photo-1592286927505-1def25115558',
        colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        name: 'iPhone 15 Pro Max',
        release_date: '2023-09-22',
        image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc',
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        storage_sizes: ['256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        name: 'iPhone 15 Pro',
        release_date: '2023-09-22',
        image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc',
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 15',
        name: 'iPhone 15',
        release_date: '2023-09-22',
        colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 15 Plus',
        name: 'iPhone 15 Plus',
        release_date: '2023-09-22',
        colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 14 Pro Max',
        name: 'iPhone 14 Pro Max',
        release_date: '2022-09-16',
        colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        name: 'iPhone 14 Pro',
        release_date: '2022-09-16',
        colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 14',
        name: 'iPhone 14',
        release_date: '2022-09-16',
        colors: ['Midnight', 'Purple', 'Starlight', 'Red', 'Blue'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone 14 Plus',
        name: 'iPhone 14 Plus',
        release_date: '2022-10-07',
        colors: ['Midnight', 'Purple', 'Starlight', 'Red', 'Blue'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Apple',
        model: 'iPhone SE (3rd generation)',
        name: 'iPhone SE',
        release_date: '2022-03-18',
        colors: ['Midnight', 'Starlight', 'Red'],
        storage_sizes: ['64GB', '128GB', '256GB']
      },

      // Samsung Galaxy S Series
      {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        name: 'Samsung Galaxy S24 Ultra',
        release_date: '2024-01-31',
        image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',
        colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'],
        storage_sizes: ['256GB', '512GB', '1TB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S24+',
        name: 'Samsung Galaxy S24+',
        release_date: '2024-01-31',
        colors: ['Onyx Black', 'Cobalt Violet', 'Amber Yellow', 'Marble Grey'],
        storage_sizes: ['256GB', '512GB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S24',
        name: 'Samsung Galaxy S24',
        release_date: '2024-01-31',
        colors: ['Onyx Black', 'Cobalt Violet', 'Amber Yellow', 'Marble Grey'],
        storage_sizes: ['128GB', '256GB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        name: 'Samsung Galaxy S23 Ultra',
        release_date: '2023-02-17',
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        storage_sizes: ['256GB', '512GB', '1TB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S23+',
        name: 'Samsung Galaxy S23+',
        release_date: '2023-02-17',
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        storage_sizes: ['256GB', '512GB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S23',
        name: 'Samsung Galaxy S23',
        release_date: '2023-02-17',
        colors: ['Phantom Black', 'Green', 'Cream', 'Lavender'],
        storage_sizes: ['128GB', '256GB']
      },

      // Samsung Galaxy Z Series (Foldables)
      {
        brand: 'Samsung',
        model: 'Galaxy Z Fold6',
        name: 'Samsung Galaxy Z Fold6',
        release_date: '2024-07-24',
        colors: ['Silver Shadow', 'Pink', 'Navy'],
        storage_sizes: ['256GB', '512GB', '1TB']
      },
      {
        brand: 'Samsung',
        model: 'Galaxy Z Flip6',
        name: 'Samsung Galaxy Z Flip6',
        release_date: '2024-07-24',
        colors: ['Silver Shadow', 'Yellow', 'Blue', 'Mint'],
        storage_sizes: ['256GB', '512GB']
      },

      // Google Pixel
      {
        brand: 'Google',
        model: 'Pixel 9 Pro XL',
        name: 'Google Pixel 9 Pro XL',
        release_date: '2024-08-22',
        colors: ['Obsidian', 'Porcelain', 'Hazel', 'Rose Quartz'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Google',
        model: 'Pixel 9 Pro',
        name: 'Google Pixel 9 Pro',
        release_date: '2024-08-22',
        colors: ['Obsidian', 'Porcelain', 'Hazel', 'Rose Quartz'],
        storage_sizes: ['128GB', '256GB', '512GB']
      },
      {
        brand: 'Google',
        model: 'Pixel 9',
        name: 'Google Pixel 9',
        release_date: '2024-08-22',
        colors: ['Obsidian', 'Porcelain', 'Wintergreen', 'Peony'],
        storage_sizes: ['128GB', '256GB']
      },
      {
        brand: 'Google',
        model: 'Pixel 9 Pro Fold',
        name: 'Google Pixel 9 Pro Fold',
        release_date: '2024-09-04',
        colors: ['Obsidian', 'Porcelain'],
        storage_sizes: ['256GB', '512GB']
      },
      {
        brand: 'Google',
        model: 'Pixel 8 Pro',
        name: 'Google Pixel 8 Pro',
        release_date: '2023-10-12',
        colors: ['Obsidian', 'Porcelain', 'Bay'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Google',
        model: 'Pixel 8',
        name: 'Google Pixel 8',
        release_date: '2023-10-12',
        colors: ['Obsidian', 'Hazel', 'Rose', 'Mint'],
        storage_sizes: ['128GB', '256GB']
      },
      {
        brand: 'Google',
        model: 'Pixel 8a',
        name: 'Google Pixel 8a',
        release_date: '2024-05-14',
        colors: ['Obsidian', 'Porcelain', 'Bay', 'Aloe'],
        storage_sizes: ['128GB', '256GB']
      },

      // iPads
      {
        brand: 'Apple',
        model: 'iPad Pro 13"',
        name: 'iPad Pro 13-inch (M4)',
        release_date: '2024-05-15',
        colors: ['Space Black', 'Silver'],
        storage_sizes: ['256GB', '512GB', '1TB', '2TB']
      },
      {
        brand: 'Apple',
        model: 'iPad Pro 11"',
        name: 'iPad Pro 11-inch (M4)',
        release_date: '2024-05-15',
        colors: ['Space Black', 'Silver'],
        storage_sizes: ['256GB', '512GB', '1TB', '2TB']
      },
      {
        brand: 'Apple',
        model: 'iPad Air 13"',
        name: 'iPad Air 13-inch (M2)',
        release_date: '2024-05-15',
        colors: ['Space Gray', 'Starlight', 'Purple', 'Blue'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPad Air 11"',
        name: 'iPad Air 11-inch (M2)',
        release_date: '2024-05-15',
        colors: ['Space Gray', 'Starlight', 'Purple', 'Blue'],
        storage_sizes: ['128GB', '256GB', '512GB', '1TB']
      },
      {
        brand: 'Apple',
        model: 'iPad (10th generation)',
        name: 'iPad 10.9-inch',
        release_date: '2022-10-26',
        colors: ['Silver', 'Pink', 'Blue', 'Yellow'],
        storage_sizes: ['64GB', '256GB']
      },
      {
        brand: 'Apple',
        model: 'iPad mini',
        name: 'iPad mini (6th generation)',
        release_date: '2021-09-24',
        colors: ['Space Gray', 'Pink', 'Purple', 'Starlight'],
        storage_sizes: ['64GB', '256GB']
      }
    ];

    console.log(`Syncing ${popularDevices.length} popular devices...`);
    const result = await this.saveDevices(popularDevices);
    
    return {
      success: true,
      devicesAdded: result.savedCount,
      devicesUpdated: result.updatedCount,
      totalProcessed: popularDevices.length,
      errors: result.errors
    };
  }

  /**
   * Save devices to database
   */
  private async saveDevices(devices: DeviceInfo[]) {
    let savedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const device of devices) {
      try {
        // First, ensure manufacturer exists
        let manufacturerId: string | null = null;
        const { data: manufacturer, error: mfgError } = await this.supabase
          .from('manufacturers')
          .select('id')
          .eq('name', device.brand)
          .single();

        if (manufacturer) {
          manufacturerId = manufacturer.id;
        } else if (mfgError?.code === 'PGRST116') {
          // No manufacturer found, create one
          const { data: newManufacturer, error: createError } = await this.supabase
            .from('manufacturers')
            .insert({ name: device.brand })
            .select('id')
            .single();
          
          if (createError) {
            console.error(`Failed to create manufacturer ${device.brand}:`, createError);
            errors.push(`Failed to create manufacturer ${device.brand}: ${createError.message}`);
            continue;
          }
          
          if (newManufacturer) {
            manufacturerId = newManufacturer.id;
          }
        }

        // Check if device already exists by model_name and get current data
        const { data: existing, error: checkError } = await this.supabase
          .from('devices')
          .select('*')
          .eq('model_name', device.name)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking existing device ${device.name}:`, checkError);
          errors.push(`Error checking device ${device.name}: ${checkError.message}`);
          continue;
        }

        if (existing) {
          // Only update fields that are empty or need updating
          const releaseYear = device.release_date ? new Date(device.release_date).getFullYear() : null;
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          // Only update brand if it's missing
          if (!existing.brand) updateData.brand = device.brand;
          
          // Only update model if it's missing or empty
          if (!existing.model) updateData.model = device.model;
          
          // Don't overwrite existing model_number if it has a real value
          if (!existing.model_number || existing.model_number === '') {
            updateData.model_number = device.model;
          }
          
          // Update release info if missing
          if (!existing.release_year && releaseYear) updateData.release_year = releaseYear;
          if (!existing.release_date && device.release_date) updateData.release_date = device.release_date;
          
          // Only update image URLs if they're missing or are placeholder URLs
          if (!existing.image_url || existing.image_url.includes('unsplash')) {
            if (device.image_url && !device.image_url.includes('unsplash')) {
              updateData.image_url = device.image_url;
            }
          }
          if (!existing.thumbnail_url || existing.thumbnail_url.includes('unsplash')) {
            if (device.image_url && !device.image_url.includes('unsplash')) {
              updateData.thumbnail_url = device.image_url;
            }
          }
          
          // Update arrays if they're empty
          if (!existing.storage_options || existing.storage_options.length === 0) {
            updateData.storage_options = device.storage_sizes || [];
          }
          if (!existing.color_options || existing.color_options.length === 0) {
            updateData.color_options = device.colors || [];
          }
          if (!existing.colors || (existing.colors && Object.keys(existing.colors).length === 0)) {
            updateData.colors = device.colors || [];
          }
          if (!existing.storage_sizes || (existing.storage_sizes && Object.keys(existing.storage_sizes).length === 0)) {
            updateData.storage_sizes = device.storage_sizes || [];
          }
          
          // Update specifications if missing
          if (!existing.screen_size && device.specifications?.display) {
            updateData.screen_size = device.specifications.display;
          }
          if (!existing.specifications || Object.keys(existing.specifications).length === 0) {
            updateData.specifications = device.specifications || {};
          }
          
          // Update manufacturer if missing
          if (!existing.manufacturer_id && manufacturerId) {
            updateData.manufacturer_id = manufacturerId;
          }

          // Only perform update if there are fields to update
          if (Object.keys(updateData).length > 1) { // More than just updated_at
            const { error: updateError } = await this.supabase
              .from('devices')
              .update(updateData)
              .eq('id', existing.id);

            if (updateError) {
              console.error(`Failed to update device ${device.name}:`, updateError);
              errors.push(`Failed to update ${device.name}: ${updateError.message}`);
            } else {
              updatedCount++;
              console.log(`Updated device: ${device.name} with fields:`, Object.keys(updateData));
            }
          } else {
            console.log(`No updates needed for ${device.name}`);
          }
        } else {
          // Insert new device with ALL columns properly populated
          const releaseYear = device.release_date ? new Date(device.release_date).getFullYear() : null;
          const deviceType = device.name.toLowerCase().includes('ipad') || device.name.toLowerCase().includes('tab') 
            ? 'tablet' 
            : device.name.toLowerCase().includes('watch') 
            ? 'smartwatch'
            : 'smartphone';
            
          const { error: insertError } = await this.supabase
            .from('devices')
            .insert({
              // New columns
              brand: device.brand,
              model: device.model,
              model_name: device.name,
              release_date: device.release_date,
              colors: device.colors || [],
              storage_sizes: device.storage_sizes || [],
              
              // Original columns
              model_number: device.model,
              release_year: releaseYear,
              image_url: device.image_url,
              thumbnail_url: device.image_url, // Use same image for thumbnail
              storage_options: device.storage_sizes || [],
              color_options: device.colors || [],
              screen_size: device.specifications?.display || null,
              specifications: device.specifications || {},
              device_type: deviceType,
              
              // Other fields
              manufacturer_id: manufacturerId,
              is_active: true,
              popularity_score: 0
            });

          if (insertError) {
            console.error(`Failed to insert device ${device.name}:`, insertError);
            console.error('Insert data was:', {
              brand: device.brand,
              model: device.model,
              model_name: device.name,
              manufacturer_id: manufacturerId
            });
            errors.push(`Failed to insert ${device.name}: ${insertError.message}`);
          } else {
            savedCount++;
            console.log(`Successfully inserted new device: ${device.name} (${device.brand})`);
          }
        }
      } catch (error) {
        console.error(`Error saving device ${device.name}:`, error);
        errors.push(`Error with ${device.name}: ${error}`);
      }
    }

    console.log(`Sync complete: ${savedCount} new devices, ${updatedCount} updated, ${errors.length} errors`);
    if (errors.length > 0) {
      console.error('Errors during sync:', errors);
    }

    return { savedCount, updatedCount, errors };
  }

  /**
   * Fetch device images from Unsplash API
   */
  async fetchDeviceImage(deviceName: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(deviceName)}&per_page=1`,
        {
          headers: {
            'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.results[0]?.urls?.regular || null;
    } catch (error) {
      console.error('Error fetching device image:', error);
      return null;
    }
  }
}