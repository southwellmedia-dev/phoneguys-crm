import { z } from 'zod';
import { ServiceRepository } from '@/lib/repositories/service.repository';
import { Service, ServiceCategory, SkillLevel } from '@/lib/types/database.types';

// Validation schemas
export const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  category: z.enum([
    'screen_repair', 'battery_replacement', 'charging_port', 'water_damage', 
    'diagnostic', 'software_issue', 'camera_repair', 'speaker_repair',
    'button_repair', 'motherboard_repair', 'data_recovery', 'other'
  ]).optional(),
  base_price: z.number().min(0, 'Price must be positive').optional(),
  estimated_duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').optional(),
  requires_parts: z.boolean().default(false),
  skill_level: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;

export class ServiceService {
  private serviceRepo: ServiceRepository;

  constructor() {
    this.serviceRepo = new ServiceRepository(true); // Use service role for admin operations
  }

  async createService(data: CreateServiceInput): Promise<Service> {
    const validated = CreateServiceSchema.parse(data);
    
    // Clean up data
    const cleanedData = {
      ...validated,
      description: validated.description || null,
      category: validated.category || null,
      base_price: validated.base_price || null,
      estimated_duration_minutes: validated.estimated_duration_minutes || null,
      skill_level: validated.skill_level || null,
    };

    try {
      const service = await this.serviceRepo.create(cleanedData);
      return service;
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('A service with this name already exists');
      }
      throw new Error('Failed to create service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async updateService(id: string, data: UpdateServiceInput): Promise<Service> {
    const validated = UpdateServiceSchema.parse(data);
    
    // Clean up data
    const cleanedData = {
      ...validated,
      description: validated.description === '' ? null : validated.description,
      category: validated.category || null,
      base_price: validated.base_price || null,
      estimated_duration_minutes: validated.estimated_duration_minutes || null,
      skill_level: validated.skill_level || null,
    };

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
    );

    try {
      const service = await this.serviceRepo.update(id, updateData);
      if (!service) {
        throw new Error('Service not found');
      }
      return service;
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('A service with this name already exists');
      }
      throw new Error('Failed to update service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      // Check if service is used in any repair tickets
      const serviceStats = await this.serviceRepo.getServiceStatistics(id);
      if (serviceStats.total_performed > 0) {
        // Instead of deleting, deactivate the service
        await this.serviceRepo.update(id, { is_active: false });
        return true;
      }
      
      // If never used, safe to delete
      return await this.serviceRepo.delete(id);
    } catch (error) {
      throw new Error('Failed to delete service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    return await this.serviceRepo.findById(id);
  }

  async getAllActiveServices(): Promise<Service[]> {
    return await this.serviceRepo.getActiveServices();
  }

  async getServicesByCategory(category: ServiceCategory): Promise<Service[]> {
    return await this.serviceRepo.findByCategory(category);
  }

  async searchServices(searchTerm: string): Promise<Service[]> {
    return await this.serviceRepo.searchServices(searchTerm);
  }

  async duplicateService(serviceId: string, newName: string): Promise<Service> {
    if (!newName.trim()) {
      throw new Error('New service name is required');
    }
    return await this.serviceRepo.duplicateService(serviceId, newName.trim());
  }

  async updateServiceOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
    return await this.serviceRepo.updateSortOrder(updates);
  }

  async toggleServiceStatus(id: string): Promise<Service> {
    const service = await this.serviceRepo.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }
    
    const updated = await this.serviceRepo.update(id, { is_active: !service.is_active });
    if (!updated) {
      throw new Error('Failed to update service status');
    }
    return updated;
  }
}