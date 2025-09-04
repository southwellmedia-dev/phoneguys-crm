import { CustomerDeviceRepository } from '../repositories/customer-device.repository';
import { RepairTicketRepository } from '../repositories/repair-ticket.repository';
import { DeviceRepository } from '../repositories/device.repository';
import { CustomerDevice } from '../types/database.types';

export class CustomerDeviceService {
  private customerDeviceRepo: CustomerDeviceRepository;
  private ticketRepo: RepairTicketRepository;
  private deviceRepo: DeviceRepository;

  constructor(useServiceRole = false) {
    this.customerDeviceRepo = new CustomerDeviceRepository(useServiceRole);
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
    this.deviceRepo = new DeviceRepository(useServiceRole);
  }

  /**
   * Get all devices for a customer with full details
   */
  async getCustomerDevices(customerId: string): Promise<CustomerDevice[]> {
    return this.customerDeviceRepo.findByCustomer(customerId);
  }

  /**
   * Add a device to a customer's profile
   */
  async addDeviceToCustomer(
    customerId: string,
    deviceData: {
      device_id: string;
      serial_number?: string;
      imei?: string;
      color?: string;
      storage_size?: string;
      nickname?: string;
      purchase_date?: string;
      warranty_expires?: string;
      condition?: string;
      notes?: string;
      is_primary?: boolean;
    }
  ): Promise<CustomerDevice> {
    // Check if device already exists for this customer
    if (deviceData.serial_number) {
      const existing = await this.customerDeviceRepo.findBySerialNumber(deviceData.serial_number);
      if (existing && existing.customer_id === customerId) {
        throw new Error('This device is already registered to your account');
      }
    }

    if (deviceData.imei) {
      const existing = await this.customerDeviceRepo.findByIMEI(deviceData.imei);
      if (existing && existing.customer_id === customerId) {
        throw new Error('This device is already registered to your account');
      }
    }

    // If setting as primary, unset other primary devices first
    if (deviceData.is_primary) {
      await this.customerDeviceRepo.setPrimaryDevice(customerId, '');
    }

    // Create the customer device
    return this.customerDeviceRepo.create({
      customer_id: customerId,
      ...deviceData,
      is_active: true,
    });
  }

  /**
   * Create a customer device from an order
   */
  async createFromOrder(orderId: string): Promise<CustomerDevice | null> {
    const order = await this.ticketRepo.findById(orderId);
    if (!order || !order.customer_id) {
      throw new Error('Order not found or no customer associated');
    }

    // Check if device already exists for customer
    if (order.serial_number) {
      const existing = await this.customerDeviceRepo.findBySerialNumber(order.serial_number);
      if (existing && existing.customer_id === order.customer_id) {
        // Update existing device with order info if needed
        return existing;
      }
    }

    if (order.imei) {
      const existing = await this.customerDeviceRepo.findByIMEI(order.imei);
      if (existing && existing.customer_id === order.customer_id) {
        return existing;
      }
    }

    // Create new customer device from order
    const customerDevice = await this.customerDeviceRepo.create({
      customer_id: order.customer_id,
      device_id: order.device_id,
      serial_number: order.serial_number,
      imei: order.imei,
      notes: `Added from repair order ${order.ticket_number}`,
      is_active: true,
      previous_repairs: [{
        ticket_id: order.id,
        ticket_number: order.ticket_number,
        date: order.created_at,
        status: order.status,
        issues: order.repair_issues,
      }],
    });

    return customerDevice;
  }

  /**
   * Sync order with customer device
   */
  async syncOrderWithDevice(
    orderId: string,
    customerDeviceId?: string
  ): Promise<void> {
    const order = await this.ticketRepo.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    let customerDevice: CustomerDevice | null = null;

    if (customerDeviceId) {
      // Use specified customer device
      customerDevice = await this.customerDeviceRepo.findById(customerDeviceId);
    } else if (order.serial_number || order.imei) {
      // Try to find customer device by serial/IMEI
      if (order.serial_number) {
        customerDevice = await this.customerDeviceRepo.findBySerialNumber(order.serial_number);
      }
      if (!customerDevice && order.imei) {
        customerDevice = await this.customerDeviceRepo.findByIMEI(order.imei);
      }
    }

    if (customerDevice) {
      // Update order with customer device info
      await this.ticketRepo.update(orderId, {
        customer_device_id: customerDevice.id,
        device_id: customerDevice.device_id,
        serial_number: customerDevice.serial_number || order.serial_number,
        imei: customerDevice.imei || order.imei,
      });

      // Add repair to device history
      await this.customerDeviceRepo.addRepairToHistory(customerDevice.id, {
        ticket_id: order.id,
        date: order.created_at,
        services: order.ticket_services?.map((ts: any) => ts.service?.name) || [],
        cost: order.actual_cost || order.estimated_cost || 0,
      });
    } else if (order.customer_id) {
      // Create new customer device from order
      const newDevice = await this.createFromOrder(orderId);
      if (newDevice) {
        // Update order with new customer device
        await this.ticketRepo.update(orderId, {
          customer_device_id: newDevice.id,
        });
      }
    }
  }

  /**
   * Get suggested devices for an order based on customer
   */
  async getSuggestedDevices(customerId: string): Promise<CustomerDevice[]> {
    const devices = await this.customerDeviceRepo.findByCustomer(customerId);
    
    // Sort by primary first, then by most recent
    return devices.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  /**
   * Update customer device details
   */
  async updateDevice(
    deviceId: string,
    updates: Partial<CustomerDevice>
  ): Promise<CustomerDevice> {
    // If setting as primary, handle unsetting others
    if (updates.is_primary) {
      const device = await this.customerDeviceRepo.findById(deviceId);
      if (device) {
        await this.customerDeviceRepo.setPrimaryDevice(device.customer_id, deviceId);
        delete updates.is_primary; // Already handled by setPrimaryDevice
      }
    }

    return this.customerDeviceRepo.update(deviceId, updates);
  }

  /**
   * Get repair history for a device
   */
  async getDeviceRepairHistory(customerDeviceId: string): Promise<any[]> {
    const { repair_history } = await this.customerDeviceRepo.getDeviceHistory(customerDeviceId);
    return repair_history;
  }

  /**
   * Check if a device exists for any customer
   */
  async checkDeviceExists(identifier: { serial_number?: string; imei?: string }): Promise<{
    exists: boolean;
    device?: CustomerDevice;
    customer?: any;
  }> {
    let device: CustomerDevice | null = null;

    if (identifier.serial_number) {
      device = await this.customerDeviceRepo.findBySerialNumber(identifier.serial_number);
    }
    
    if (!device && identifier.imei) {
      device = await this.customerDeviceRepo.findByIMEI(identifier.imei);
    }

    return {
      exists: !!device,
      device: device || undefined,
      customer: device?.customer,
    };
  }

  /**
   * Transfer device between customers
   */
  async transferDevice(
    deviceId: string,
    fromCustomerId: string,
    toCustomerId: string,
    notes?: string
  ): Promise<CustomerDevice> {
    const device = await this.customerDeviceRepo.transferDevice(
      deviceId,
      fromCustomerId,
      toCustomerId
    );

    // Add transfer note
    if (notes) {
      await this.customerDeviceRepo.update(deviceId, {
        notes: `${device.notes || ''}\n[${new Date().toISOString()}] Transfer: ${notes}`,
      });
    }

    return device;
  }
}