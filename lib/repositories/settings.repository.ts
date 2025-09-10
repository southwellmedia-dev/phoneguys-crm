import { BaseRepository } from './base.repository';
import { BusinessHours, StoreSettings, AppointmentSettings } from '@/lib/types/database.types';

export class BusinessHoursRepository extends BaseRepository<BusinessHours> {
  constructor(useServiceRole = false) {
    super('business_hours', useServiceRole);
  }

  async getAll(): Promise<BusinessHours[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .order('day_of_week');

    if (error) {
      throw new Error(`Failed to fetch business hours: ${error.message}`);
    }

    return data as BusinessHours[];
  }

  async updateDay(dayOfWeek: number, hours: Partial<BusinessHours>): Promise<BusinessHours> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .update(hours)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update business hours: ${error.message}`);
    }

    return data as BusinessHours;
  }

  async bulkUpdate(hours: Partial<BusinessHours>[]): Promise<BusinessHours[]> {
    const client = await this.getClient();
    const updates = await Promise.all(
      hours.map(h => 
        h.day_of_week !== undefined 
          ? this.updateDay(h.day_of_week, h)
          : Promise.resolve(null)
      )
    );

    return updates.filter(Boolean) as BusinessHours[];
  }
}

export class StoreSettingsRepository extends BaseRepository<StoreSettings> {
  constructor(useServiceRole = false) {
    super('store_settings', useServiceRole);
  }

  async get(): Promise<StoreSettings | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch store settings: ${error.message}`);
    }

    return data as StoreSettings;
  }

  async upsert(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .upsert(settings)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update store settings: ${error.message}`);
    }

    return data as StoreSettings;
  }
}

export class AppointmentSettingsRepository extends BaseRepository<AppointmentSettings> {
  constructor(useServiceRole = false) {
    super('appointment_settings', useServiceRole);
  }

  async get(): Promise<AppointmentSettings | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch appointment settings: ${error.message}`);
    }

    return data as AppointmentSettings;
  }

  async upsert(settings: Partial<AppointmentSettings>): Promise<AppointmentSettings> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .upsert(settings)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment settings: ${error.message}`);
    }

    return data as AppointmentSettings;
  }
}