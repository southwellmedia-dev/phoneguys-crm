import { BaseRepository } from './base.repository';
import { Service, ServiceCategory, SkillLevel } from '@/lib/types/database.types';

export class ServiceRepository extends BaseRepository<Service> {
  constructor(useServiceRole = false) {
    super('services', useServiceRole);
  }

  async findByCategory(category: ServiceCategory): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select()
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch services by category: ${error.message}`);
    }

    return data as Service[];
  }

  async findBySkillLevel(skillLevel: SkillLevel): Promise<Service[]> {
    return this.findAll({ skill_level: skillLevel, is_active: true });
  }

  async getActiveServices(): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select()
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch active services: ${error.message}`);
    }

    return data as Service[];
  }

  async getServicesRequiringParts(): Promise<Service[]> {
    return this.findAll({ requires_parts: true, is_active: true });
  }

  async searchServices(searchTerm: string): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select()
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('sort_order')
      .order('name')
      .limit(20);

    if (error) {
      throw new Error(`Failed to search services: ${error.message}`);
    }

    return data as Service[];
  }

  async getServicesByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select()
      .gte('base_price', minPrice)
      .lte('base_price', maxPrice)
      .eq('is_active', true)
      .order('base_price');

    if (error) {
      throw new Error(`Failed to fetch services by price range: ${error.message}`);
    }

    return data as Service[];
  }

  async getQuickServices(maxDuration: number = 60): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select()
      .lte('estimated_duration_minutes', maxDuration)
      .eq('is_active', true)
      .order('estimated_duration_minutes');

    if (error) {
      throw new Error(`Failed to fetch quick services: ${error.message}`);
    }

    return data as Service[];
  }

  async getServiceStatistics(serviceId: string): Promise<{
    service: Service;
    total_performed: number;
    average_price: number | null;
    total_revenue: number;
  }> {
    const client = await this.getClient();
    
    // Get service with ticket services
    const { data: service, error: serviceError } = await client
      .from(this.tableName)
      .select(`
        *,
        ticket_services (
          id,
          unit_price,
          quantity
        )
      `)
      .eq('id', serviceId)
      .single();

    if (serviceError && serviceError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch service statistics: ${serviceError.message}`);
    }

    if (!service) {
      throw new Error('Service not found');
    }

    // Calculate statistics
    const ticketServices = (service as any).ticket_services || [];
    let totalRevenue = 0;
    let totalPrice = 0;
    let priceCount = 0;

    ticketServices.forEach((ts: any) => {
      if (ts.unit_price) {
        const revenue = ts.unit_price * (ts.quantity || 1);
        totalRevenue += revenue;
        totalPrice += ts.unit_price;
        priceCount++;
      }
    });

    delete (service as any).ticket_services;

    return {
      service: service as Service,
      total_performed: ticketServices.length,
      average_price: priceCount > 0 ? totalPrice / priceCount : null,
      total_revenue: totalRevenue
    };
  }

  async updateSortOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
    const client = await this.getClient();
    
    // Update each service's sort order
    for (const update of updates) {
      const { error } = await client
        .from(this.tableName)
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) {
        throw new Error(`Failed to update sort order for service ${update.id}: ${error.message}`);
      }
    }
  }

  async duplicateService(serviceId: string, newName: string): Promise<Service> {
    const original = await this.findById(serviceId);
    if (!original) {
      throw new Error('Service not found');
    }

    const { id, created_at, updated_at, ...serviceData } = original;
    
    return this.create({
      ...serviceData,
      name: newName,
      is_active: false // Start as inactive
    } as Omit<Service, 'id' | 'created_at' | 'updated_at'>);
  }

  async bulkImport(services: Partial<Service>[]): Promise<Service[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert(services)
      .select();

    if (error) {
      throw new Error(`Failed to bulk import services: ${error.message}`);
    }

    return data as Service[];
  }
}