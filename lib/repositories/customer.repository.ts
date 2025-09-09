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
    
    if (filters.search) {
      // Split search query into individual words
      const searchTerms = filters.search.trim().split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      // For single word, use the original logic
      if (searchTerms.length === 1) {
        let query = client.from(this.tableName).select('*');
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        
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
      
      // For multiple words, fetch all customers and filter in memory
      // This is necessary because Supabase doesn't support complex AND/OR combinations well
      let query = client.from(this.tableName).select('*');
      
      // Build an OR query for all search terms
      const orConditions = searchTerms.map(term => 
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
      ).join(',');
      
      query = query.or(orConditions);
      
      if (filters.email) {
        query = query.eq('email', filters.email);
      }
      if (filters.phone) {
        query = query.eq('phone', filters.phone);
      }
      
      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to search customers: ${error.message}`);
      }
      
      if (!data) return [];
      
      // Score and filter results based on how many search terms match
      const scoredResults = data.map(customer => {
        let score = 0;
        const customerText = `${customer.name} ${customer.email} ${customer.phone || ''}`.toLowerCase();
        
        // Count how many search terms appear in the customer data
        for (const term of searchTerms) {
          if (customerText.includes(term.toLowerCase())) {
            score++;
          }
        }
        
        return { customer, score };
      });
      
      // Filter out results that don't match enough search terms
      // Require all terms to match for best results
      const filteredResults = scoredResults
        .filter(result => result.score === searchTerms.length)
        .sort((a, b) => b.score - a.score || a.customer.name.localeCompare(b.customer.name))
        .map(result => result.customer);
      
      // If no results with all terms, try with at least 50% of terms
      if (filteredResults.length === 0 && searchTerms.length > 2) {
        const minScore = Math.ceil(searchTerms.length / 2);
        return scoredResults
          .filter(result => result.score >= minScore)
          .sort((a, b) => b.score - a.score || a.customer.name.localeCompare(b.customer.name))
          .map(result => result.customer);
      }
      
      return filteredResults;
    }

    // If no search term, handle other filters
    let query = client.from(this.tableName).select('*');
    
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

  async findRecent(limit: number = 10): Promise<Customer[]> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select('*, repair_tickets(id)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent customers: ${error.message}`);
    }

    return data as Customer[];
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