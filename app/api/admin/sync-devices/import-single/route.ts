import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRepository } from '@/lib/repositories/repository-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userRepo = getRepository.users();
    const userData = await userRepo.findByEmail(user.email || '');
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { apiKey, device, fetchFullDetails = true } = body;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    if (!device) {
      return NextResponse.json({ error: 'Device data required' }, { status: 400 });
    }
    
    console.log(`Importing device: ${device.model_name}`);
    
    try {
      // If fetchFullDetails is true and we have an external_id, fetch comprehensive specs
      let deviceToImport = { ...device };
      
      if (fetchFullDetails && device.external_id) {
        console.log(`Fetching full details for device ${device.external_id}...`);
        
        // Parse API credentials
        let apiId = '';
        let apiSecret = apiKey;
        
        if (apiKey.includes(':')) {
          [apiId, apiSecret] = apiKey.split(':');
        }
        
        try {
          const response = await fetch(`https://api.techspecs.io/v5/products/${device.external_id}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-api-id': apiId || '68c18c13b5806a0967b28212',
              'x-api-key': apiSecret
            }
          });
          
          if (response.ok) {
            const fullData = await response.json();
            const details = fullData.data;
            
            if (details) {
              // Map comprehensive specs
              const specs: any = {};
              
              // Basic info
              if (details.Product) {
                deviceToImport.model_name = details.Product.Model || device.model_name;
                deviceToImport.model_number = details.Product.Version || device.model_number;
              }
              
              // Release info
              if (details['Release Date']) {
                const releaseStr = details['Release Date'];
                const yearMatch = releaseStr.match(/(\d{4})/);
                if (yearMatch) {
                  deviceToImport.release_year = parseInt(yearMatch[1]);
                  
                  // Try to construct a full date
                  const months: any = {
                    'January': '01', 'February': '02', 'March': '03', 'April': '04',
                    'May': '05', 'June': '06', 'July': '07', 'August': '08',
                    'September': '09', 'October': '10', 'November': '11', 'December': '12'
                  };
                  const monthMatch = releaseStr.match(/^(\w+)/);
                  if (monthMatch && months[monthMatch[1]]) {
                    deviceToImport.release_date = `${deviceToImport.release_year}-${months[monthMatch[1]]}-01`;
                  }
                }
              }
              
              // Display
              if (details.Display) {
                specs.display_type = details.Display.Type;
                specs.display_size = details.Display.Diagonal;
                specs.resolution = details.Display['Resolution (H x W)'];
                specs.refresh_rate = details.Display['Refresh Rate'];
                deviceToImport.screen_size = details.Display.Diagonal;
              }
              
              // Processor & RAM
              if (details.Inside) {
                if (details.Inside.Processor) {
                  specs.processor = details.Inside.Processor.CPU;
                  specs.gpu = details.Inside.Processor.GPU;
                }
                if (details.Inside.RAM) {
                  specs.ram = details.Inside.RAM.Capacity;
                }
                if (details.Inside.Storage?.Capacity) {
                  const storageStr = details.Inside.Storage.Capacity;
                  deviceToImport.storage_options = storageStr.split(',').map((s: string) => s.trim());
                }
              }
              
              // Battery
              if (details.Battery) {
                specs.battery_capacity = details.Battery.Capacity;
                specs.charging_power = details.Battery['Charging Power'];
                specs.wireless_charging = details.Battery['Wireless Charging'];
              }
              
              // Camera
              if (details.Camera?.['Back Camera']) {
                specs.main_camera = details.Camera['Back Camera'].Resolution;
              }
              
              // Design
              if (details.Design?.Body) {
                specs.weight = details.Design.Body.Weight;
                specs.dimensions = `${details.Design.Body.Height} x ${details.Design.Body.Width} x ${details.Design.Body.Thickness}`;
                
                if (details.Design.Body.Colors && details.Design.Body.Colors !== "The data will be added shortly") {
                  deviceToImport.colors = details.Design.Body.Colors.split(',').map((c: string) => c.trim());
                }
              }
              
              // Image
              if (details.Image && typeof details.Image === 'string' && !details.Image.includes('Please upgrade')) {
                deviceToImport.external_thumbnail_url = details.Image;
              }
              
              deviceToImport.specifications = specs;
              console.log('Successfully fetched full device details');
            }
          }
        } catch (error) {
          console.error('Error fetching full details:', error);
          // Continue with basic import if full details fail
        }
      }
      
      // Ensure manufacturer exists
      let manufacturerId: string | null = null;
      
      const { data: manufacturer, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('id')
        .eq('name', deviceToImport.brand)
        .maybeSingle();
      
      if (!manufacturer) {
        const { data: newManufacturer } = await supabase
          .from('manufacturers')
          .insert({ name: deviceToImport.brand })
          .select('id')
          .single();
        
        if (newManufacturer) {
          manufacturerId = newManufacturer.id;
        }
      } else {
        manufacturerId = manufacturer.id;
      }
      
      // Insert the device
      const { data: insertedDevice, error: insertError } = await supabase
        .from('devices')
        .insert({
          manufacturer_id: manufacturerId,
          brand: deviceToImport.brand,
          model: deviceToImport.model,
          model_name: deviceToImport.model_name,
          model_number: deviceToImport.model_number,
          release_date: deviceToImport.release_date,
          release_year: deviceToImport.release_year,
          external_id: deviceToImport.external_id,
          external_thumbnail_url: deviceToImport.external_thumbnail_url || deviceToImport.image_url,
          sync_source: 'techspecs',
          last_synced_at: new Date().toISOString(),
          colors: deviceToImport.colors || [],
          storage_options: deviceToImport.storage_options || [],
          screen_size: deviceToImport.screen_size,
          specifications: deviceToImport.specifications || {},
          device_type: 'smartphone',
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: `Failed to import device: ${insertError.message}` },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        device: insertedDevice,
        message: `Successfully imported ${deviceToImport.model_name}`
      });
      
    } catch (error) {
      console.error('Import error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Import failed' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error importing device:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import device' 
      },
      { status: 500 }
    );
  }
}