import { BaseRepository } from './base.repository';
import { CustomerDevice, DeviceCondition } from '@/lib/types/database.types';

export class CustomerDeviceRepository extends BaseRepository<CustomerDevice> {
  constructor(useServiceRole = false) {
    super('customer_devices', useServiceRole);
  }

  async findByCustomer(customerId: string): Promise<CustomerDevice[]> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          id,
          model_name,
          model_number,
          device_type,
          thumbnail_url,
          image_url,
          manufacturer:manufacturers (
            id,
            name
          )
        )
      `)
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customer devices: ${error.message}`);
    }

    return data as CustomerDevice[];
  }

  async findByDevice(deviceId: string): Promise<CustomerDevice[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        customer:customers!customer_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch devices by device ID: ${error.message}`);
    }

    return data as CustomerDevice[];
  }

  async findBySerialNumber(serialNumber: string): Promise<CustomerDevice | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          id,
          model_name,
          image_url,
          manufacturer:manufacturers (
            name
          )
        ),
        customer:customers!customer_id (
          id,
          name,
          email
        )
      `)
      .eq('serial_number', serialNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device by serial number: ${error.message}`);
    }

    return data as CustomerDevice;
  }

  async findByIMEI(imei: string): Promise<CustomerDevice | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          id,
          model_name,
          image_url,
          manufacturer:manufacturers (
            name
          )
        ),
        customer:customers!customer_id (
          id,
          name,
          email
        )
      `)
      .eq('imei', imei)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device by IMEI: ${error.message}`);
    }

    return data as CustomerDevice;
  }

  async getPrimaryDevice(customerId: string): Promise<CustomerDevice | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          id,
          model_name,
          device_type,
          thumbnail_url,
          image_url,
          manufacturer:manufacturers (
            name
          )
        )
      `)
      .eq('customer_id', customerId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null; // No primary device
    }

    return data as CustomerDevice;
  }

  async setPrimaryDevice(customerId: string, deviceId: string): Promise<void> {
    const client = await this.getClient();
    
    // First, unset all other primary devices for this customer
    await client
      .from(this.tableName)
      .update({ is_primary: false })
      .eq('customer_id', customerId);

    // Then set the new primary device
    const { error } = await client
      .from(this.tableName)
      .update({ is_primary: true })
      .eq('id', deviceId)
      .eq('customer_id', customerId);

    if (error) {
      throw new Error(`Failed to set primary device: ${error.message}`);
    }
  }

  async getDevicesByCondition(condition: DeviceCondition): Promise<CustomerDevice[]> {
    return this.findAll({ condition, is_active: true });
  }

  async getWarrantyExpiringDevices(days: number = 30): Promise<CustomerDevice[]> {
    const client = await this.getClient();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          model_name,
          manufacturer:manufacturers (
            name
          )
        ),
        customer:customers!customer_id (
          name,
          email,
          phone
        )
      `)
      .gte('warranty_expires', new Date().toISOString())
      .lte('warranty_expires', futureDate.toISOString())
      .eq('is_active', true)
      .order('warranty_expires');

    if (error) {
      throw new Error(`Failed to fetch warranty expiring devices: ${error.message}`);
    }

    return data as CustomerDevice[];
  }

  async getDeviceHistory(deviceId: string): Promise<{
    device: CustomerDevice;
    repair_history: any[];
  }> {
    const client = await this.getClient();
    
    const { data: device, error: deviceError } = await client
      .from(this.tableName)
      .select(`
        *,
        device:devices!device_id (
          model_name,
          manufacturer:manufacturers (
            name
          )
        )
      `)
      .eq('id', deviceId)
      .single();

    if (deviceError && deviceError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device: ${deviceError.message}`);
    }

    if (!device) {
      throw new Error('Device not found');
    }

    // Get repair history for this device
    const { data: repairs, error: repairsError } = await client
      .from('repair_tickets')
      .select(`
        id,
        ticket_number,
        status,
        repair_issues,
        actual_cost,
        date_received,
        completed_at
      `)
      .eq('customer_device_id', deviceId)
      .order('date_received', { ascending: false });

    if (repairsError) {
      throw new Error(`Failed to fetch repair history: ${repairsError.message}`);
    }

    return {
      device: device as CustomerDevice,
      repair_history: repairs || []
    };
  }

  async addRepairToHistory(
    deviceId: string,
    repairData: {
      ticket_id: string;
      date: string;
      services: string[];
      cost: number;
    }
  ): Promise<void> {
    const device = await this.findById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const previousRepairs = device.previous_repairs || [];
    previousRepairs.push({
      ...repairData,
      added_at: new Date().toISOString()
    });

    await this.update(deviceId, {
      previous_repairs: previousRepairs
    });
  }

  async transferDevice(
    deviceId: string,
    fromCustomerId: string,
    toCustomerId: string
  ): Promise<CustomerDevice> {
    const device = await this.findById(deviceId);
    if (!device || device.customer_id !== fromCustomerId) {
      throw new Error('Device not found or unauthorized');
    }

    return this.update(deviceId, {
      customer_id: toCustomerId,
      is_primary: false // Reset primary status on transfer
    });
  }
}