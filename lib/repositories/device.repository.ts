import { BaseRepository } from './base.repository';
import { Device, DeviceType, PartsAvailability } from '@/lib/types/database.types';

export class DeviceRepository extends BaseRepository<Device> {
  constructor(useServiceRole = false) {
    super('devices', useServiceRole);
  }

  async findWithManufacturer(deviceId: string): Promise<Device | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        manufacturer:manufacturers (
          id,
          name,
          logo_url,
          country
        )
      `)
      .eq('id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device with manufacturer: ${error.message}`);
    }

    return data as Device;
  }

  async findByManufacturer(manufacturerId: string): Promise<Device[]> {
    return this.findAll({ manufacturer_id: manufacturerId });
  }

  async findByType(deviceType: DeviceType): Promise<Device[]> {
    return this.findAll({ device_type: deviceType });
  }

  async searchDevices(searchTerm: string): Promise<Device[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        manufacturer:manufacturers (
          id,
          name
        )
      `)
      .or(`model_name.ilike.%${searchTerm}%,model_number.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('model_name')
      .limit(50);

    if (error) {
      throw new Error(`Failed to search devices: ${error.message}`);
    }

    return data as Device[];
  }

  async getPopularDevices(limit = 10): Promise<Device[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        manufacturer:manufacturers (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true)
      .order('total_repairs_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch popular devices: ${error.message}`);
    }

    return data as Device[];
  }

  async findByAvailability(availability: PartsAvailability): Promise<Device[]> {
    return this.findAll({ parts_availability: availability });
  }

  async updateRepairCount(deviceId: string, increment: number): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .rpc('increment', {
        table_name: this.tableName,
        row_id: deviceId,
        column_name: 'total_repairs_count',
        increment_value: increment
      });

    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const device = await this.findById(deviceId);
      if (device) {
        await this.update(deviceId, {
          total_repairs_count: (device.total_repairs_count || 0) + increment
        });
      }
    }
  }

  async getDevicesByReleaseYear(year: number): Promise<Device[]> {
    return this.findAll({ release_year: year });
  }

  async getActiveDevices(): Promise<Device[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        manufacturer:manufacturers (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true)
      .order('manufacturer_id')
      .order('model_name');

    if (error) {
      throw new Error(`Failed to fetch active devices: ${error.message}`);
    }

    return data as Device[];
  }

  async getDeviceStatistics(deviceId: string): Promise<{
    device: Device;
    total_repairs: number;
    common_issues: string[];
    average_repair_cost: number | null;
    average_repair_time: number | null;
  }> {
    const client = await this.getClient();
    
    // Get device with repair statistics
    const { data: device, error: deviceError } = await client
      .from(this.tableName)
      .select(`
        *,
        manufacturer:manufacturers (
          id,
          name
        ),
        repair_tickets!device_id (
          id,
          actual_cost,
          total_time_minutes,
          repair_issues
        )
      `)
      .eq('id', deviceId)
      .single();

    if (deviceError && deviceError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device statistics: ${deviceError.message}`);
    }

    if (!device) {
      throw new Error('Device not found');
    }

    // Calculate statistics from repair tickets
    const repairs = (device as any).repair_tickets || [];
    const issuesCount: Record<string, number> = {};
    let totalCost = 0;
    let totalTime = 0;
    let costCount = 0;
    let timeCount = 0;

    repairs.forEach((repair: any) => {
      if (repair.actual_cost) {
        totalCost += repair.actual_cost;
        costCount++;
      }
      if (repair.total_time_minutes) {
        totalTime += repair.total_time_minutes;
        timeCount++;
      }
      repair.repair_issues?.forEach((issue: string) => {
        issuesCount[issue] = (issuesCount[issue] || 0) + 1;
      });
    });

    // Sort issues by frequency
    const commonIssues = Object.entries(issuesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    delete (device as any).repair_tickets;

    return {
      device: device as Device,
      total_repairs: repairs.length,
      common_issues: commonIssues,
      average_repair_cost: costCount > 0 ? totalCost / costCount : null,
      average_repair_time: timeCount > 0 ? totalTime / timeCount : null
    };
  }

  async bulkImport(devices: Partial<Device>[]): Promise<Device[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert(devices)
      .select();

    if (error) {
      throw new Error(`Failed to bulk import devices: ${error.message}`);
    }

    return data as Device[];
  }

  async getPopularDeviceIds(limit = 100): Promise<{ device_id: string; count: number }[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('repair_tickets')
      .select('device_id')
      .not('device_id', 'is', null)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch popular device IDs: ${error.message}`);
    }

    // Count occurrences of each device_id
    const deviceCounts = (data || []).reduce((acc: Record<string, number>, ticket: any) => {
      acc[ticket.device_id] = (acc[ticket.device_id] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by count
    return Object.entries(deviceCounts)
      .map(([device_id, count]) => ({ device_id, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getAllManufacturers(): Promise<{ id: string; name: string }[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('manufacturers')
      .select('id, name')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch manufacturers: ${error.message}`);
    }

    return data || [];
  }
}