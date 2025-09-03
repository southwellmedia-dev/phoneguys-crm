import { BaseRepository } from './base.repository';
import { Customer, CustomerFilters, CreateCustomerDto, UpdateCustomerDto } from '@/lib/types';

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(useServiceRole = false) {
    super('customers', useServiceRole);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.findOne({ email });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.findOne({ phone });
  }

  async searchCustomers(filters: CustomerFilters): Promise<Customer[]> {
    const client = await this.getClient();
    let query = client.from(this.tableName).select('*');

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    if (filters.email) {
      query = query.eq('email', filters.email);
    }

    if (filters.phone) {
      query = query.eq('phone', filters.phone);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }

    return data as Customer[];
  }

  async findAllWithRepairCount(): Promise<(Customer & { repair_count: number })[]> {
    const client = await this.getClient();
    
    // Get customers with repair count using a left join
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        repair_tickets!left(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customers with repair count: ${error.message}`);
    }

    // Transform the data to include repair_count
    return (data || []).map(customer => ({
      ...customer,
      repair_count: customer.repair_tickets?.[0]?.count || 0
    })) as (Customer & { repair_count: number })[];
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    // Check if customer already exists
    const existingCustomer = await this.findByEmail(data.email);
    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    return this.create(data);
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    // If email is being updated, check for duplicates
    if (data.email) {
      const existingCustomer = await this.findByEmail(data.email);
      if (existingCustomer && existingCustomer.id !== id) {
        throw new Error('Another customer with this email already exists');
      }
    }

    return this.update(id, data);
  }

  async getCustomerWithRepairs(customerId: string): Promise<Customer & { repair_tickets?: any[] } | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        repair_tickets (
          id,
          ticket_number,
          device_brand,
          device_model,
          status,
          priority,
          date_received,
          date_completed
        )
      `)
      .eq('id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch customer with repairs: ${error.message}`);
    }

    return data as (Customer & { repair_tickets?: any[] }) | null;
  }

  async getCustomersWithRecentActivity(daysAgo: number = 30): Promise<Customer[]> {
    const client = await this.getClient();
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        repair_tickets!inner (
          id
        )
      `)
      .gte('repair_tickets.date_received', dateThreshold.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customers with recent activity: ${error.message}`);
    }

    // Remove the repair_tickets from the result as we only used it for filtering
    return (data as any[]).map(({ repair_tickets, ...customer }) => customer) as Customer[];
  }

  async countActiveCustomers(): Promise<number> {
    const client = await this.getClient();
    const { count, error } = await client
      .from(this.tableName)
      .select('*, repair_tickets!inner(id)', { count: 'exact', head: true })
      .in('repair_tickets.status', ['new', 'in_progress', 'on_hold']);

    if (error) {
      throw new Error(`Failed to count active customers: ${error.message}`);
    }

    return count || 0;
  }
}