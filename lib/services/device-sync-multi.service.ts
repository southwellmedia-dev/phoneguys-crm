import { SupabaseClient } from '@supabase/supabase-js';
import { DeviceSyncBaseService } from './device-sync-base.service';

interface MultiSyncResult {
  success: boolean;
  existingDevices: any[];
  newDevices: any[];
  updatedCount: number;
  updatedDevices: Array<{
    name: string;
    fieldsUpdated: string[];
  }>;
  errors?: string[];
  message?: string;
  brandResults?: Array<{
    brand: string;
    found: number;
    added: number;
    updated: number;
  }>;
}

/**
 * Extension of DeviceSyncService to handle multi-manufacturer sync
 */
export class DeviceSyncMultiService extends DeviceSyncBaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Smart sync that handles multiple manufacturers
   */
  async smartSyncMultipleDevices(apiKey: string, options?: {
    limit?: number;
    brand?: string;
    autoImport?: boolean;
    fetchFullDetails?: boolean;
  }): Promise<MultiSyncResult> {
    try {
      const totalLimit = options?.limit || 10;
      const singleBrand = options?.brand;
      
      // If a specific brand is provided, use the existing single-brand logic
      if (singleBrand && singleBrand !== '') {
        return await this.smartSyncDevices(apiKey, options);
      }
      
      // Multiple manufacturers sync - prioritize popular brands
      // Give more allocation to Apple and Samsung as they're most common
      const brandAllocations = [
        { brand: 'Apple', weight: 0.3 },      // 30% of devices
        { brand: 'Samsung', weight: 0.3 },    // 30% of devices  
        { brand: 'Google', weight: 0.15 },    // 15% of devices
        { brand: 'OnePlus', weight: 0.1 },    // 10% of devices
        { brand: 'Xiaomi', weight: 0.075 },   // 7.5% of devices
        { brand: 'Motorola', weight: 0.075 }  // 7.5% of devices
      ];
      
      const brandsToSync = brandAllocations.map(b => b.brand);
      
      // Calculate per-brand limits based on weights
      const brandLimits: Record<string, number> = {};
      let allocatedDevices = 0;
      
      brandAllocations.forEach((allocation, index) => {
        const isLast = index === brandAllocations.length - 1;
        if (isLast) {
          // Give remaining devices to last brand to ensure we use full limit
          brandLimits[allocation.brand] = totalLimit - allocatedDevices;
        } else {
          const limit = Math.floor(totalLimit * allocation.weight);
          brandLimits[allocation.brand] = Math.max(1, limit); // At least 1 device per brand
          allocatedDevices += brandLimits[allocation.brand];
        }
      });
      
      console.log(`Syncing all manufacturers: ${brandsToSync.join(', ')}`);
      console.log(`Total limit: ${totalLimit}`);
      console.log('Brand allocations:', brandLimits);
      
      // Aggregate results
      const allExistingDevices: any[] = [];
      const allNewDevices: any[] = [];
      let totalUpdatedCount = 0;
      const allUpdatedDevices: Array<{ name: string; fieldsUpdated: string[] }> = [];
      const allErrors: string[] = [];
      const brandResults: Array<{ brand: string; found: number; added: number; updated: number }> = [];
      
      // Process each brand
      for (const brand of brandsToSync) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Processing ${brand}...`);
        console.log(`${'='.repeat(50)}`);
        
        try {
          const brandLimit = brandLimits[brand] || 1;
          console.log(`Fetching ${brandLimit} devices for ${brand}...`);
          
          const brandResult = await this.smartSyncDevices(apiKey, {
            limit: brandLimit,
            brand: brand,
            autoImport: options?.autoImport || false,
            fetchFullDetails: options?.fetchFullDetails || false
          });
          
          if (brandResult.success) {
            // Aggregate results
            allExistingDevices.push(...(brandResult.existingDevices || []));
            allNewDevices.push(...(brandResult.newDevices || []));
            totalUpdatedCount += brandResult.updatedCount || 0;
            allUpdatedDevices.push(...(brandResult.updatedDevices || []));
            
            brandResults.push({
              brand,
              found: (brandResult.existingDevices?.length || 0) + (brandResult.newDevices?.length || 0),
              added: brandResult.newDevices?.length || 0,
              updated: brandResult.updatedCount || 0
            });
            
            console.log(`✓ ${brand}: Found ${brandResult.existingDevices?.length || 0} existing, ${brandResult.newDevices?.length || 0} new devices`);
          } else {
            console.log(`✗ ${brand}: ${brandResult.message || 'Failed to sync'}`);
            if (brandResult.errors?.length) {
              allErrors.push(...brandResult.errors);
            }
          }
        } catch (error) {
          console.error(`Error syncing ${brand}:`, error);
          allErrors.push(`${brand}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Small delay between brands to avoid rate limiting
        if (brandsToSync.indexOf(brand) < brandsToSync.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`\n${'='.repeat(50)}`);
      console.log('Multi-brand sync complete!');
      console.log(`Total: ${allExistingDevices.length} existing, ${allNewDevices.length} new, ${totalUpdatedCount} updated`);
      console.log(`${'='.repeat(50)}`);
      
      return {
        success: true,
        existingDevices: allExistingDevices,
        newDevices: allNewDevices,
        updatedCount: totalUpdatedCount,
        updatedDevices: allUpdatedDevices,
        errors: allErrors.length > 0 ? allErrors : undefined,
        brandResults
      };
    } catch (error) {
      console.error('Multi-sync error:', error);
      return {
        success: false,
        existingDevices: [],
        newDevices: [],
        updatedCount: 0,
        updatedDevices: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}