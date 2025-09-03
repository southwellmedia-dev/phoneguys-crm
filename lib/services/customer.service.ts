import { CustomerRepository } from '../repositories/customer.repository';
import { RepairTicketRepository } from '../repositories/repair-ticket.repository';
import { Customer, CreateCustomerDto, UpdateCustomerDto, RepairTicket } from '../types/database.types';
import { PaginatedResponse, FilterOperator } from '../types/database.types';

export class CustomerService {
  private customerRepo: CustomerRepository;
  private ticketRepo: RepairTicketRepository;

  constructor(useServiceRole = false) {
    this.customerRepo = new CustomerRepository(useServiceRole);
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
  }

  /**
   * Get all customers with optional filters
   */
  async getCustomers(
    filters?: Record<string, any>,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<Customer>> {
    return this.customerRepo.findAll(filters, page, pageSize);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepo.findById(id);
  }

  /**
   * Search customers by name, email, or phone
   */
  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    // Search across multiple fields
    const filters = [
      { field: 'name', operator: FilterOperator.ILIKE, value: `%${searchTerm}%` },
      { field: 'email', operator: FilterOperator.ILIKE, value: `%${searchTerm}%` },
      { field: 'phone', operator: FilterOperator.ILIKE, value: `%${searchTerm}%` }
    ];

    const results = await Promise.all(
      filters.map(filter => this.customerRepo.findAll(filter))
    );

    // Combine and deduplicate results
    const customerMap = new Map<string, Customer>();
    results.flat().forEach(customer => {
      if (customer) {
        customerMap.set(customer.id, customer);
      }
    });

    return Array.from(customerMap.values());
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    // Check if customer already exists with same email
    const existing = await this.customerRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    return this.customerRepo.create(data);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // If email is being changed, check for duplicates
    if (data.email && data.email !== customer.email) {
      const existing = await this.customerRepo.findByEmail(data.email);
      if (existing) {
        throw new Error('Another customer with this email already exists');
      }
    }

    return this.customerRepo.update(id, data);
  }

  /**
   * Delete a customer (soft delete by marking as inactive)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if customer has any active repairs
    const activeTickets = await this.ticketRepo.findByCustomerId(id);
    const hasActiveRepairs = activeTickets.some(
      ticket => ['new', 'in_progress', 'on_hold'].includes(ticket.status)
    );

    if (hasActiveRepairs) {
      throw new Error('Cannot delete customer with active repair tickets');
    }

    // Soft delete by marking as inactive
    return this.customerRepo.update(id, { is_active: false }).then(() => true);
  }

  /**
   * Get customer's repair history
   */
  async getCustomerHistory(customerId: string): Promise<{
    customer: Customer | null;
    repairs: RepairTicket[];
    statistics: {
      totalRepairs: number;
      completedRepairs: number;
      activeRepairs: number;
      totalSpent: number;
      averageRepairTime: number;
    };
  }> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const repairs = await this.ticketRepo.findByCustomerId(customerId);
    
    // Calculate statistics
    const statistics = {
      totalRepairs: repairs.length,
      completedRepairs: repairs.filter(r => r.status === 'completed').length,
      activeRepairs: repairs.filter(r => ['new', 'in_progress', 'on_hold'].includes(r.status)).length,
      totalSpent: repairs.reduce((sum, r) => sum + (r.total_cost || 0), 0),
      averageRepairTime: this.calculateAverageRepairTime(repairs)
    };

    return {
      customer,
      repairs,
      statistics
    };
  }

  /**
   * Merge two customer records (in case of duplicates)
   */
  async mergeCustomers(
    primaryCustomerId: string,
    secondaryCustomerId: string
  ): Promise<Customer> {
    const [primaryCustomer, secondaryCustomer] = await Promise.all([
      this.customerRepo.findById(primaryCustomerId),
      this.customerRepo.findById(secondaryCustomerId)
    ]);

    if (!primaryCustomer || !secondaryCustomer) {
      throw new Error('One or both customers not found');
    }

    // Transfer all tickets from secondary to primary customer
    const secondaryTickets = await this.ticketRepo.findByCustomerId(secondaryCustomerId);
    
    for (const ticket of secondaryTickets) {
      await this.ticketRepo.update(ticket.id, { customer_id: primaryCustomerId });
    }

    // Mark secondary customer as inactive with merge note
    await this.customerRepo.update(secondaryCustomerId, {
      is_active: false,
      notes: `Merged with customer ${primaryCustomerId} on ${new Date().toISOString()}`
    });

    // Update primary customer with any missing information
    const updates: UpdateCustomerDto = {};
    if (!primaryCustomer.phone && secondaryCustomer.phone) {
      updates.phone = secondaryCustomer.phone;
    }
    if (!primaryCustomer.address && secondaryCustomer.address) {
      updates.address = secondaryCustomer.address;
    }
    if (!primaryCustomer.notes && secondaryCustomer.notes) {
      updates.notes = secondaryCustomer.notes;
    }

    if (Object.keys(updates).length > 0) {
      return this.customerRepo.update(primaryCustomerId, updates);
    }

    return primaryCustomer;
  }

  /**
   * Get customers with upcoming appointments or pending repairs
   */
  async getCustomersWithPendingWork(): Promise<{
    customer: Customer;
    pendingTickets: RepairTicket[];
  }[]> {
    const allTickets = await this.ticketRepo.findAll({
      field: 'status',
      operator: FilterOperator.IN,
      value: ['new', 'in_progress', 'on_hold']
    });

    // Group tickets by customer
    const customerTicketsMap = new Map<string, RepairTicket[]>();
    for (const ticket of allTickets) {
      if (!customerTicketsMap.has(ticket.customer_id)) {
        customerTicketsMap.set(ticket.customer_id, []);
      }
      customerTicketsMap.get(ticket.customer_id)!.push(ticket);
    }

    // Fetch customer details
    const results = [];
    for (const [customerId, tickets] of customerTicketsMap) {
      const customer = await this.customerRepo.findById(customerId);
      if (customer) {
        results.push({
          customer,
          pendingTickets: tickets
        });
      }
    }

    return results;
  }

  /**
   * Calculate average repair time in hours
   */
  private calculateAverageRepairTime(repairs: RepairTicket[]): number {
    const completedRepairs = repairs.filter(r => 
      r.status === 'completed' && r.completed_at && r.created_at
    );

    if (completedRepairs.length === 0) return 0;

    const totalTime = completedRepairs.reduce((sum, repair) => {
      const start = new Date(repair.created_at).getTime();
      const end = new Date(repair.completed_at!).getTime();
      return sum + (end - start);
    }, 0);

    // Return average time in hours
    return Math.round(totalTime / completedRepairs.length / (1000 * 60 * 60));
  }

  /**
   * Export customer data for reporting
   */
  async exportCustomerData(customerId?: string): Promise<any> {
    if (customerId) {
      const customerData = await this.getCustomerHistory(customerId);
      return {
        customer: customerData.customer,
        repairs: customerData.repairs,
        statistics: customerData.statistics,
        exportedAt: new Date().toISOString()
      };
    }

    // Export all customers
    const customers = await this.customerRepo.findAll();
    const exportData = [];

    for (const customer of customers) {
      const history = await this.getCustomerHistory(customer.id);
      exportData.push({
        ...customer,
        totalRepairs: history.statistics.totalRepairs,
        totalSpent: history.statistics.totalSpent
      });
    }

    return {
      customers: exportData,
      exportedAt: new Date().toISOString(),
      totalCustomers: exportData.length
    };
  }
}