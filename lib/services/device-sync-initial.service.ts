import { SupabaseClient } from '@supabase/supabase-js';
import { DeviceSyncBaseService } from './device-sync-base.service';

interface InitialSyncResult {
  success: boolean;
  devicesImported: number;
  totalFound: number;
  errors?: string[];
  brandBreakdown?: Array<{
    brand: string;
    found: number;
    imported: number;
  }>;
}

/**
 * Service for initial database population with latest devices
 */
export class DeviceSyncInitialService extends DeviceSyncBaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }
  
  /**
   * Fetch full device details from TechSpecs API
   */
  private async fetchDeviceDetails(apiKey: string, productId: string, apiId?: string): Promise<any> {
    try {
      let finalApiId = apiId || '';
      let apiSecret = apiKey;
      
      if (!apiId && apiKey.includes(':')) {
        [finalApiId, apiSecret] = apiKey.split(':');
      }
      
      const response = await fetch(`https://api.techspecs.io/v5/products/${productId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-id': finalApiId || '68c18c13b5806a0967b28212',
          'x-api-key': apiSecret
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch details for product ${productId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error(`Error fetching device details for ${productId}:`, error);
      return null;
    }
  }
  
  /**
   * Map full TechSpecs device details to update fields
   */
  private mapTechSpecsFullDetails(details: any): any {
    if (!details) return {};
    
    const updates: any = {};
    
    // Basic product info
    if (details.Product) {
      if (details.Product.Model) {
        updates.model_name = details.Product.Model;
      }
      if (details.Product.Version) {
        updates.model_number = details.Product.Version;
      }
    }
    
    // Release date - convert "September 2024" format to date
    if (details['Release Date']) {
      const releaseStr = details['Release Date'];
      const yearMatch = releaseStr.match(/(\d{4})/);
      if (yearMatch) {
        updates.release_year = parseInt(yearMatch[1]);
        // Try to construct a full date
        const months: any = {
          'January': '01', 'February': '02', 'March': '03', 'April': '04',
          'May': '05', 'June': '06', 'July': '07', 'August': '08',
          'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        const monthMatch = releaseStr.match(/^(\w+)/);
        if (monthMatch && months[monthMatch[1]]) {
          updates.release_date = `${updates.release_year}-${months[monthMatch[1]]}-01`;
        }
      }
    }
    
    // Image URL
    if (details.Image && typeof details.Image === 'string' && !details.Image.includes('Please upgrade')) {
      updates.image_url = details.Image;
      updates.external_thumbnail_url = details.Image;
    }
    
    // Extract comprehensive specifications
    const specs: any = {};
    
    if (details.Inside) {
      // Processor info
      if (details.Inside.Processor) {
        specs.processor = details.Inside.Processor.CPU;
        specs.cpu_speed = details.Inside.Processor['CPU Clock Speed'];
        specs.gpu = details.Inside.Processor.GPU;
      }
      
      // RAM
      if (details.Inside.RAM) {
        specs.ram = details.Inside.RAM.Capacity;
        specs.ram_type = details.Inside.RAM.Type;
      }
      
      // Storage options
      if (details.Inside.Storage?.Capacity) {
        const storageStr = details.Inside.Storage.Capacity;
        const storageOptions = storageStr.split(',').map((s: string) => s.trim());
        if (storageOptions.length > 0) {
          updates.storage_sizes = storageOptions;
          updates.storage_options = storageOptions;
        }
      }
      
      // OS
      if (details.Inside.Software) {
        specs.os = details.Inside.Software.OS;
        specs.os_version = details.Inside.Software['OS Version'];
      }
    }
    
    // Battery
    if (details.Battery) {
      specs.battery = details.Battery.Capacity;
      specs.battery_type = details.Battery.Type;
      specs.charging_power = details.Battery['Charging Power'];
      specs.wireless_charging = details.Battery['Wireless Charging'];
    }
    
    // Display info
    if (details.Display) {
      specs.display = details.Display.Type;
      specs.display_size = details.Display.Diagonal;
      specs.resolution = details.Display['Resolution (H x W)'];
      specs.refresh_rate = details.Display['Refresh Rate'];
      
      // Screen size for main field
      if (details.Display.Diagonal) {
        updates.screen_size = details.Display.Diagonal;
      }
    }
    
    // Camera
    if (details.Camera?.['Back Camera']) {
      specs.main_camera = details.Camera['Back Camera'].Resolution;
      specs.camera_features = details.Camera['Back Camera'].Features;
    }
    
    // Physical dimensions
    if (details.Design?.Body) {
      specs.weight = details.Design.Body.Weight;
      specs.dimensions = `${details.Design.Body.Height} x ${details.Design.Body.Width} x ${details.Design.Body.Thickness}`;
      
      // Colors
      if (details.Design.Body.Colors && details.Design.Body.Colors !== "The data will be added shortly") {
        const colors = details.Design.Body.Colors.split(',').map((c: string) => c.trim());
        if (colors.length > 0) {
          updates.colors = colors;
          updates.color_options = colors;
        }
      }
    }
    
    updates.specifications = specs;
    
    return updates;
  }

  /**
   * Perform initial sync to populate database with latest devices
   * This fetches top/latest devices from all major brands
   */
  async performInitialSync(apiKey: string, options?: {
    totalDevices?: number;  // Default 100
    autoImport?: boolean;   // Default true for initial sync
    fetchFullDetails?: boolean; // Default true for initial sync
  }): Promise<InitialSyncResult> {
    try {
      const totalDevices = options?.totalDevices || 100;
      const autoImport = options?.autoImport !== false; // Default true
      const fetchFullDetails = options?.fetchFullDetails !== false; // Default true
      
      console.log(`${'='.repeat(60)}`);
      console.log('INITIAL DEVICE SYNC - Populating Database');
      console.log(`Target: ${totalDevices} latest devices`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Define search queries for each brand to get their latest models
      // Using broader search terms to get more results
      const brandSearches = [
        { brand: 'Apple', queries: [
          'iPhone', // This should get ALL iPhones
          'Apple iPhone 14', // Backup specific searches if the broad one doesn't work well
          'Apple iPhone 13',
          'Apple iPhone 12',
          'Apple iPhone 11',
          'iPad Pro 2024',
          'iPad Air 2024'
        ]},
        { brand: 'Samsung', queries: [
          'Galaxy S24 Ultra', 'Galaxy S24 Plus', 'Galaxy S24',
          'Galaxy S23 Ultra', 'Galaxy S23 Plus', 'Galaxy S23',
          'Galaxy S22 Ultra', 'Galaxy S22 Plus', 'Galaxy S22',
          'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Flip 6', 'Galaxy Z Flip 5',
          'Galaxy A54', 'Galaxy A34', 'Galaxy A14'
        ]},
        { brand: 'Google', queries: [
          'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9a',
          'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
          'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
          'Pixel Fold', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a'
        ]},
        { brand: 'OnePlus', queries: ['OnePlus 12', 'OnePlus 11', 'OnePlus Open', 'OnePlus Nord', 'OnePlus 10 Pro'] },
        { brand: 'Xiaomi', queries: ['Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13', 'Redmi Note 13', 'POCO F6'] },
        { brand: 'Motorola', queries: ['Moto Edge 50', 'Moto G84', 'Moto Razr 50'] },
        { brand: 'Nothing', queries: ['Nothing Phone 2', 'Nothing Phone 1'] },
        { brand: 'OPPO', queries: ['OPPO Find X7', 'OPPO Reno 11'] },
        { brand: 'Vivo', queries: ['Vivo X100', 'Vivo V30'] },
        { brand: 'Realme', queries: ['Realme GT 6', 'Realme 12 Pro'] }
      ];
      
      // Collect all devices
      const allDevices: any[] = [];
      const brandBreakdown: Array<{ brand: string; found: number; imported: number }> = [];
      
      // Parse API credentials
      let apiId = '';
      let apiSecret = apiKey;
      
      if (apiKey.includes(':')) {
        [apiId, apiSecret] = apiKey.split(':');
      }
      
      // Process each brand
      for (const brandSearch of brandSearches) {
        console.log(`\nSearching ${brandSearch.brand} devices...`);
        const brandDevices: any[] = [];
        
        // For Apple, use a special broader search first
        if (brandSearch.brand === 'Apple') {
          try {
            console.log(`  - Broad search for all Apple iPhones...`);
            
            // First do a very broad search
            const broadSearchParams = new URLSearchParams({
              query: 'iPhone',
              limit: '100' // Get maximum results for Apple
            });
            
            const broadResponse = await fetch(`https://api.techspecs.io/v5/products/search?${broadSearchParams}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'x-api-id': apiId || '68c18c13b5806a0967b28212',
                'x-api-key': apiSecret
              },
              signal: AbortSignal.timeout(15000)
            });
            
            if (broadResponse.ok) {
              const broadData = await broadResponse.json();
              if (broadData.data && Array.isArray(broadData.data)) {
                // Filter for iPhones from 2020 onwards
                const appleDevices = broadData.data.filter((item: any) => {
                  const product = item.Product || {};
                  const model = product.Model || '';
                  const releaseDate = item['Release Date'];
                  
                  // Make sure it's actually an iPhone
                  if (!model.toLowerCase().includes('iphone')) return false;
                  
                  // Check release year
                  if (releaseDate) {
                    const releaseYear = parseInt(releaseDate.split('-')[0]);
                    return releaseYear >= 2020;
                  }
                  return true; // Include if no release date
                });
                
                const mapped = appleDevices.map((item: any) => {
                  const device = this.mapTechSpecsV5SearchResult(item);
                  device.brand = 'Apple';
                  return device;
                });
                
                brandDevices.push(...mapped);
                console.log(`    Found ${mapped.length} Apple devices from broad search`);
              }
            }
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.log(`    Error in Apple broad search: ${error}`);
          }
        }
        
        // Try each search query for this brand
        for (const query of brandSearch.queries) {
          // Skip the broad "iPhone" query for Apple since we already did it
          if (brandSearch.brand === 'Apple' && query === 'iPhone') continue;
          
          try {
            console.log(`  - Searching: "${query}"`);
            
            const searchParams = new URLSearchParams({
              query: query,
              limit: '50' // Get up to 50 per query to ensure we get more variety
            });
            
            const response = await fetch(`https://api.techspecs.io/v5/products/search?${searchParams}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'x-api-id': apiId || '68c18c13b5806a0967b28212',
                'x-api-key': apiSecret
              },
              signal: AbortSignal.timeout(15000)
            });
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.data && Array.isArray(data.data)) {
                // Filter for recent devices (2020 and later for broader selection)
                // This ensures we get iPhone 12, 13, 14, 15, 16 series
                const recentDevices = data.data.filter((item: any) => {
                  const releaseDate = item['Release Date'];
                  if (!releaseDate) return true; // Include devices without release date
                  
                  const releaseYear = parseInt(releaseDate.split('-')[0]);
                  return releaseYear >= 2020; // Include 2020+ to get iPhone 12 series onwards
                });
                
                // Map and add to brand devices
                const mapped = recentDevices.map((item: any) => {
                  const device = this.mapTechSpecsV5SearchResult(item);
                  // Ensure brand is set correctly
                  device.brand = brandSearch.brand;
                  return device;
                });
                
                brandDevices.push(...mapped);
                console.log(`    Found ${mapped.length} devices`);
              }
            }
            
            // Small delay between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.log(`    Error searching "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Deduplicate brand devices by model name
        const uniqueDevices = new Map<string, any>();
        brandDevices.forEach((device: any) => {
          const key = `${device.brand}-${device.name}`.toLowerCase();
          if (!uniqueDevices.has(key)) {
            uniqueDevices.set(key, device);
          }
        });
        
        const dedupedBrandDevices = Array.from(uniqueDevices.values());
        console.log(`  Total unique ${brandSearch.brand} devices: ${dedupedBrandDevices.length}`);
        
        allDevices.push(...dedupedBrandDevices);
        
        brandBreakdown.push({
          brand: brandSearch.brand,
          found: dedupedBrandDevices.length,
          imported: 0 // Will be updated after import
        });
      }
      
      // Final deduplication across all brands
      const finalUniqueDevices = new Map<string, any>();
      allDevices.forEach((device: any) => {
        const key = `${device.brand}-${device.name}`.toLowerCase();
        if (!finalUniqueDevices.has(key)) {
          finalUniqueDevices.set(key, device);
        }
      });
      
      let devicesToImport = Array.from(finalUniqueDevices.values());
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TOTAL DEVICES FOUND: ${devicesToImport.length}`);
      
      // Limit to requested number if we have more
      if (devicesToImport.length > totalDevices) {
        // Sort by release date to get newest first
        devicesToImport.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        
        devicesToImport = devicesToImport.slice(0, totalDevices);
        console.log(`Limited to ${totalDevices} newest devices`);
      }
      
      // Import devices if autoImport is true
      let importedCount = 0;
      const errors: string[] = [];
      
      if (autoImport) {
        console.log(`\nIMPORTING ${devicesToImport.length} DEVICES...`);
        console.log(`${'='.repeat(60)}`);
        
        // Check which devices already exist
        const newDevices: any[] = [];
        
        for (const device of devicesToImport) {
          // Check if device exists
          const { data: existingDevice } = await this.supabase.rpc('find_device_for_sync', {
            p_external_id: device.external_id,
            p_brand: device.brand,
            p_model_name: device.name,
            p_model_number: device.model
          }).maybeSingle();
          
          if (!existingDevice) {
            newDevices.push(device);
          }
        }
        
        console.log(`Found ${newDevices.length} new devices to import`);
        
        // If fetchFullDetails is enabled, fetch comprehensive data for each device
        if (fetchFullDetails && newDevices.length > 0) {
          console.log(`\nFETCHING FULL DETAILS for ${newDevices.length} devices...`);
          
          for (let i = 0; i < newDevices.length; i++) {
            const device = newDevices[i];
            
            if (device.external_id) {
              try {
                console.log(`  [${i + 1}/${newDevices.length}] Fetching details for ${device.name}...`);
                
                const fullDetails = await this.fetchDeviceDetails(apiKey, device.external_id, apiId);
                
                if (fullDetails) {
                  // Map the full details to enhance the device object
                  const mappedDetails = this.mapTechSpecsFullDetails(fullDetails);
                  
                  // Merge the full details into the device object
                  Object.assign(device, {
                    release_year: mappedDetails.release_year,
                    release_date: mappedDetails.release_date || device.release_date,
                    specifications: { ...device.specifications, ...mappedDetails.specifications },
                    screen_size: mappedDetails.screen_size,
                    colors: mappedDetails.colors || device.colors || [],
                    storage_sizes: mappedDetails.storage_sizes || device.storage_sizes || [],
                    image_url: mappedDetails.external_thumbnail_url || device.image_url,
                    sync_source: 'techspecs',
                    sync_status: 'synced' // Mark as fully synced since we fetched details
                  });
                  
                  console.log(`    ✓ Got full details for ${device.name}`);
                } else {
                  console.log(`    ⚠ Could not fetch full details for ${device.name}`);
                }
                
                // Small delay to avoid rate limiting
                if (i < newDevices.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              } catch (error) {
                console.log(`    ✗ Error fetching details for ${device.name}: ${error}`);
              }
            }
          }
        }
        
        if (newDevices.length > 0) {
          const importResult = await this.importNewDevices(newDevices);
          importedCount = importResult.imported;
          errors.push(...importResult.errors);
          
          // Update brand breakdown with import counts
          brandBreakdown.forEach(brand => {
            brand.imported = newDevices.filter(d => d.brand === brand.brand).length;
          });
        }
      }
      
      console.log(`\n${'='.repeat(60)}`);
      console.log('INITIAL SYNC COMPLETE!');
      console.log(`Devices imported: ${importedCount}`);
      console.log(`Total found: ${devicesToImport.length}`);
      
      if (errors.length > 0) {
        console.log(`Errors: ${errors.length}`);
      }
      
      console.log(`${'='.repeat(60)}\n`);
      
      return {
        success: true,
        devicesImported: importedCount,
        totalFound: devicesToImport.length,
        errors: errors.length > 0 ? errors : undefined,
        brandBreakdown
      };
      
    } catch (error) {
      console.error('Initial sync error:', error);
      return {
        success: false,
        devicesImported: 0,
        totalFound: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}