import { BaseRepository } from './base.repository';
import { User, UserRole } from '@/lib/types';

export class UserRepository extends BaseRepository<User> {
  constructor(useServiceRole = false) {
    super('users', useServiceRole);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByRole(role: UserRole | UserRole[]): Promise<User[]> {
    const roles = Array.isArray(role) ? role : [role];
    return this.findAll({ role: roles });
  }

  async findTechnicians(): Promise<User[]> {
    return this.findByRole('technician');
  }

  async findManagers(): Promise<User[]> {
    return this.findByRole(['manager', 'admin']);
  }

  async getUserWithAssignedTickets(userId: string): Promise<User & { assigned_tickets?: any[] } | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        assigned_tickets:repair_tickets!assigned_to (
          id,
          ticket_number,
          status,
          priority,
          device_brand,
          device_model,
          customer:customers!customer_id (
            name,
            email
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user with assigned tickets: ${error.message}`);
    }

    return data as any;
  }

  async getActiveUsers(): Promise<User[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        assigned_tickets:repair_tickets!assigned_to!inner (
          id
        )
      `)
      .in('assigned_tickets.status', ['new', 'in_progress'])
      .order('full_name');

    if (error) {
      throw new Error(`Failed to fetch active users: ${error.message}`);
    }

    // Remove the assigned_tickets from the result
    return (data as any[]).map(({ assigned_tickets, ...user }) => user) as User[];
  }

  async getUserWorkload(userId: string): Promise<{
    total_tickets: number;
    new_tickets: number;
    in_progress_tickets: number;
    on_hold_tickets: number;
  }> {
    const client = await this.getClient();
    
    const { data: tickets, error } = await client
      .from('repair_tickets')
      .select('status')
      .eq('assigned_to', userId)
      .in('status', ['new', 'in_progress', 'on_hold']);

    if (error) {
      throw new Error(`Failed to get user workload: ${error.message}`);
    }

    const workload = {
      total_tickets: 0,
      new_tickets: 0,
      in_progress_tickets: 0,
      on_hold_tickets: 0
    };

    (tickets as any[]).forEach(ticket => {
      workload.total_tickets++;
      switch (ticket.status) {
        case 'new':
          workload.new_tickets++;
          break;
        case 'in_progress':
          workload.in_progress_tickets++;
          break;
        case 'on_hold':
          workload.on_hold_tickets++;
          break;
      }
    });

    return workload;
  }

  async searchUsers(query: string): Promise<User[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name');

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data as User[];
  }
}