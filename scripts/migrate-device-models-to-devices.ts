import { config } from 'dotenv';
import { createServiceClient } from '../lib/supabase/service';

// Load environment variables
config({ path: '.env.local' });

async function migrateDeviceModels() {
  console.log('🚀 Starting migration from device_models to devices table...');
  
  const supabase = createServiceClient();
  
  try {
    // First, fetch all existing device_models with their manufacturers
    console.log('\n📋 Fetching device_models from database...');
    const { data: deviceModels, error: fetchError } = await supabase
      .from('device_models')
      .select(`
        *,
        manufacturers (
          id,
          name
        )
      `);
    
    if (fetchError) {
      console.error('Error fetching device_models:', fetchError);
      return;
    }
    
    console.log(`Found ${deviceModels?.length || 0} device models to migrate`);
    
    if (!deviceModels || deviceModels.length === 0) {
      console.log('No device models to migrate');
      return;
    }
    
    // Migrate each device model to devices table
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const model of deviceModels) {
      // Check if device already exists in devices table
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('manufacturer_id', model.manufacturer_id)
        .eq('model_name', model.model_name)
        .single();
      
      if (existingDevice) {
        console.log(`⏭️  Skipping ${model.manufacturers?.name} ${model.model_name} (already exists)`);
        skipCount++;
        continue;
      }
      
      // Map device_models fields to devices table structure
      const deviceData: any = {
        manufacturer_id: model.manufacturer_id,
        model_name: model.model_name,
        model_number: model.model_number,
        device_type: model.device_type,
        release_year: model.release_year,
        image_url: model.image_url,
        thumbnail_url: model.image_url, // Use same image for thumbnail
        storage_options: model.specifications?.storage || [],
        color_options: model.specifications?.colors || [],
        screen_size: model.specifications?.screen_size,
        specifications: model.specifications || {},
        parts_availability: determinePartsAvailability(model),
        is_active: model.is_active,
        total_repairs_count: model.total_repairs_count || 0,
      };
      
      // Map fields that exist in devices table
      if (model.common_issues) {
        deviceData.common_issues = model.common_issues;
      }
      if (model.average_repair_time_hours) {
        deviceData.average_repair_time_hours = model.average_repair_time_hours;
      }
      if (model.typical_repair_cost) {
        deviceData.average_repair_cost = model.typical_repair_cost;
      }
      
      // Insert into devices table
      const { error: insertError } = await supabase
        .from('devices')
        .insert(deviceData);
      
      if (insertError) {
        console.error(`❌ Error migrating ${model.manufacturers?.name} ${model.model_name}:`, insertError.message);
        errorCount++;
      } else {
        console.log(`✅ Migrated ${model.manufacturers?.name} ${model.model_name}`);
        successCount++;
      }
    }
    
    // Now update repair_tickets to use the new device_id instead of device_model_id
    console.log('\n🔄 Updating repair_tickets to reference devices table...');
    
    // Get all repair tickets with device_model_id
    const { data: tickets, error: ticketsError } = await supabase
      .from('repair_tickets')
      .select('id, device_model_id, device_models!inner(model_name, manufacturer_id)')
      .not('device_model_id', 'is', null);
    
    if (ticketsError) {
      console.error('Error fetching repair tickets:', ticketsError);
    } else if (tickets && tickets.length > 0) {
      console.log(`Found ${tickets.length} repair tickets to update`);
      
      for (const ticket of tickets) {
        // Find corresponding device in devices table
        const { data: device } = await supabase
          .from('devices')
          .select('id')
          .eq('manufacturer_id', ticket.device_models.manufacturer_id)
          .eq('model_name', ticket.device_models.model_name)
          .single();
        
        if (device) {
          // Update repair ticket with new device_id
          const { error: updateError } = await supabase
            .from('repair_tickets')
            .update({ device_id: device.id })
            .eq('id', ticket.id);
          
          if (updateError) {
            console.error(`Error updating ticket ${ticket.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated ticket ${ticket.id} to use device ${device.id}`);
          }
        }
      }
    }
    
    console.log(`
📊 Migration Summary:
✅ Successfully migrated: ${successCount} devices
⏭️  Skipped (already exists): ${skipCount} devices  
❌ Failed: ${errorCount} devices

✨ Migration complete!
    `);
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

function determinePartsAvailability(model: any): string {
  // Determine parts availability based on various factors
  const currentYear = new Date().getFullYear();
  const deviceAge = model.release_year ? currentYear - model.release_year : 10;
  
  if (deviceAge <= 1) return 'readily_available';
  if (deviceAge <= 3) return 'available';
  if (deviceAge <= 5) return 'limited';
  if (deviceAge <= 8) return 'scarce';
  return 'discontinued';
}

// Run the migration
migrateDeviceModels().catch(console.error);