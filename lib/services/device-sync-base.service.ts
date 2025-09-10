import { SupabaseClient } from '@supabase/supabase-js';

type DeviceType = 'smartphone' | 'tablet' | 'smartwatch' | 'other';

interface DeviceInfo {
  external_id?: string;
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

interface SyncResult {
  success: boolean;
  existingDevices: DeviceInfo[];
  newDevices: DeviceInfo[];
  updatedCount: number;
  updatedDevices?: Array<{
    name: string;
    fieldsUpdated: string[];
  }>;
  errors?: string[];
  message?: string;
}

export class DeviceSyncBaseService {
  constructor(protected supabase: SupabaseClient) {}

  /**
   * Test TechSpecs API connection with a single device
   */
  async testTechSpecsConnection(apiKey: string): Promise<{
    success: boolean;
    device?: DeviceInfo;
    error?: string;
    apiVersion?: string;
    creditsUsed?: number;
  }> {
    try {
      console.log('Testing TechSpecs API v5 connection...');
      
      let apiId = '';
      let apiSecret = apiKey;
      
      if (apiKey.includes(':')) {
        [apiId, apiSecret] = apiKey.split(':');
      }
      
      const searchParams = new URLSearchParams({
        query: 'Samsung Galaxy S24',
        limit: '1'
      });
      
      const response = await fetch(`https://api.techspecs.io/v5/products/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-id': apiId || '68c18c13b5806a0967b28212',
          'x-api-key': apiSecret
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TechSpecs API error response:', errorText);
        
        if (response.status === 401) {
          return { success: false, error: 'Invalid API key' };
        } else if (response.status === 403) {
          return { success: false, error: 'API key lacks permissions' };
        } else if (response.status === 429) {
          return { success: false, error: 'Rate limit exceeded' };
        }
        
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        return { success: false, error: 'No devices found in test query' };
      }

      const testDevice = this.mapTechSpecsV5SearchResult(data.data[0]);
      
      return {
        success: true,
        device: testDevice,
        apiVersion: 'v5',
        creditsUsed: 1
      };
    } catch (error) {
      console.error('Error testing TechSpecs connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Smart sync that checks existing devices and returns new ones for confirmation
   */
  async smartSyncDevices(apiKey: string, options?: {
    limit?: number;
    brand?: string;
    autoImport?: boolean;
    fetchFullDetails?: boolean;
  }): Promise<SyncResult> {
    try {
      const limit = options?.limit || 10;
      const brand = options?.brand;
      
      console.log(`Smart sync: Fetching ${limit} devices${brand ? ` for ${brand}` : ''}`);
      
      let searchQuery: string;
      
      if (brand) {
        switch(brand.toLowerCase()) {
          case 'apple':
            searchQuery = 'Apple iPhone 16';
            break;
          case 'samsung':
            searchQuery = 'Samsung Galaxy S24';
            break;
          case 'google':
            searchQuery = 'Google Pixel 9 Pro';  // More specific to avoid bad results
            break;
          case 'oneplus':
            searchQuery = 'OnePlus 12';
            break;
          case 'xiaomi':
            searchQuery = 'Xiaomi 14';
            break;
          case 'motorola':
            searchQuery = 'Motorola Edge 50';
            break;
          default:
            searchQuery = brand;
        }
      } else {
        searchQuery = 'iPhone 16';
      }
      
      const searchParams = new URLSearchParams({
        query: searchQuery,
        limit: (limit * 2).toString()
      });
      
      let apiId = '';
      let apiSecret = apiKey;
      
      if (apiKey.includes(':')) {
        [apiId, apiSecret] = apiKey.split(':');
      }
      
      const response = await fetch(`https://api.techspecs.io/v5/products/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-id': apiId || '68c18c13b5806a0967b28212',
          'x-api-key': apiSecret
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'TechSpecs API error',
          existingDevices: [],
          newDevices: [],
          updatedCount: 0,
          errors: [`API error: ${response.status}`]
        };
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          message: `No devices found for ${brand || 'the specified search'}`,
          existingDevices: [],
          newDevices: [],
          updatedCount: 0,
          errors: []
        };
      }
      
      // Filter for recent devices only
      const recentDevices = (data.data || []).filter((item: any) => {
        const releaseDate = item['Release Date'];
        if (!releaseDate) return false;
        
        const releaseYear = parseInt(releaseDate.split('-')[0]);
        return releaseYear >= 2023;
      });
      
      const limitedDevices = recentDevices.slice(0, limit);
      const fetchedDevices = limitedDevices.map((item: any) => this.mapTechSpecsV5SearchResult(item));
      
      // Deduplicate by model name
      const uniqueDevices = new Map<string, any>();
      fetchedDevices.forEach((device: any) => {
        const modelKey = device.name.toLowerCase().trim();
        if (!uniqueDevices.has(modelKey)) {
          uniqueDevices.set(modelKey, device);
        }
      });
      const dedupedDevices = Array.from(uniqueDevices.values());
      
      const existingDevices: DeviceInfo[] = [];
      const newDevices: DeviceInfo[] = [];
      let updatedCount = 0;
      const updatedDevices: Array<{ name: string; fieldsUpdated: string[] }> = [];
      
      for (const device of dedupedDevices) {
        const { data: existingDevice } = await this.supabase.rpc('find_device_for_sync', {
          p_external_id: device.external_id,
          p_brand: device.brand,
          p_model_name: device.name,
          p_model_number: device.model
        });
        
        if (existingDevice) {
          existingDevices.push(device);
          // Handle updates if needed
        } else {
          newDevices.push(device);
        }
      }
      
      if (options?.autoImport && newDevices.length > 0) {
        await this.importNewDevices(newDevices);
      }
      
      return {
        success: true,
        existingDevices,
        newDevices,
        updatedCount,
        updatedDevices,
        errors: []
      };
    } catch (error) {
      console.error('Smart sync error:', error);
      return {
        success: false,
        existingDevices: [],
        newDevices: [],
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Import new devices after user confirmation
   */
  async importNewDevices(devices: DeviceInfo[]): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];
    
    for (const device of devices) {
      try {
        // Ensure manufacturer exists
        let manufacturerId: string | null = null;
        const { data: manufacturer } = await this.supabase
          .from('manufacturers')
          .select('id')
          .eq('name', device.brand)
          .single();
        
        if (!manufacturer) {
          const { data: newManufacturer } = await this.supabase
            .from('manufacturers')
            .insert({ name: device.brand })
            .select('id')
            .single();
          
          if (newManufacturer) {
            manufacturerId = newManufacturer.id;
          }
        } else {
          manufacturerId = manufacturer.id;
        }
        
        // Extract release year from date if available
        let releaseYear = null;
        if (device.release_date) {
          const yearMatch = device.release_date.match(/(\d{4})/);
          if (yearMatch) {
            releaseYear = parseInt(yearMatch[1]);
          }
        }
        
        // Insert the device
        const { error } = await this.supabase
          .from('devices')
          .insert({
            manufacturer_id: manufacturerId,
            brand: device.brand,
            model: device.model,
            model_name: device.name,
            model_number: device.model,
            release_date: device.release_date,
            release_year: releaseYear || device.release_year,
            external_id: device.external_id,
            external_thumbnail_url: device.image_url,
            sync_source: device.sync_source || 'techspecs',
            last_synced_at: new Date().toISOString(),
            colors: device.colors || [],
            storage_sizes: device.storage_sizes || [],
            storage_options: device.storage_options || device.storage_sizes || [],
            screen_size: device.screen_size,
            specifications: device.specifications || {},
            device_type: 'smartphone' as DeviceType,
            is_active: true
          });
        
        if (!error) {
          imported++;
        } else {
          errors.push(`Failed to import ${device.name}: ${error.message}`);
        }
      } catch (error) {
        errors.push(`Failed to import ${device.name}: ${error}`);
      }
    }
    
    return { imported, errors };
  }

  /**
   * Sync popular devices fallback
   */
  async syncPopularDevices() {
    console.log('Starting sync of popular devices...');
    
    const popularDevices: DeviceInfo[] = [
      {
        brand: 'Apple',
        model: 'iPhone 16 Pro Max',
        name: 'iPhone 16 Pro Max',
        release_date: '2024-09-20'
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        name: 'Samsung Galaxy S24 Ultra',
        release_date: '2024-01-31'
      },
      {
        brand: 'Google',
        model: 'Pixel 9 Pro XL',
        name: 'Google Pixel 9 Pro XL',
        release_date: '2024-08-22'
      }
    ];

    const result = await this.importNewDevices(popularDevices);
    
    return {
      success: true,
      devicesAdded: result.imported,
      devicesUpdated: 0,
      totalProcessed: popularDevices.length,
      errors: result.errors
    };
  }

  /**
   * Legacy syncFromTechSpecs method for backward compatibility
   */
  async syncFromTechSpecs(apiKey: string) {
    const result = await this.smartSyncDevices(apiKey, {
      limit: 50,
      autoImport: true
    });
    
    return {
      success: result.success,
      devicesAdded: result.newDevices.length
    };
  }

  /**
   * Map TechSpecs v5 search result to our DeviceInfo structure
   */
  protected mapTechSpecsV5SearchResult(item: any): DeviceInfo {
    const product = item.Product || {};
    const thumbnail = item.Thumbnail;
    const releaseDate = item['Release Date'];
    
    // Clean up model/version - if it contains multiple space-separated values, take the first one
    let model = product.Version || '';
    if (model && model.includes(' ')) {
      // Check if it looks like multiple model numbers concatenated
      const parts = model.split(' ');
      if (parts.length > 3) {
        // Likely corrupted data, take only the first valid-looking part
        model = parts[0];
      }
    }
    
    // Clean up the model name too
    let modelName = product.Model || '';
    if (!modelName && product.Brand) {
      // If no model name, try to construct from brand and version
      modelName = `${product.Brand} ${model}`.trim();
    }
    
    return {
      external_id: product.id || null,
      brand: product.Brand || '',
      model: model,
      name: modelName,
      release_date: releaseDate || null,
      image_url: thumbnail || null,
      colors: [],
      storage_sizes: [],
      specifications: {
        category: product.Category || null,
        version: product.Version || null
      }
    };
  }
}