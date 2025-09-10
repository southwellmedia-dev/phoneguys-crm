import { 
  BusinessHoursRepository, 
  StoreSettingsRepository, 
  AppointmentSettingsRepository 
} from '@/lib/repositories/settings.repository';
import { BusinessHours, StoreSettings, AppointmentSettings } from '@/lib/types/database.types';

export interface SettingsUpdate {
  businessHours?: Partial<BusinessHours>[];
  storeSettings?: Partial<StoreSettings>;
  appointmentSettings?: Partial<AppointmentSettings>;
}

export class SettingsService {
  private businessHoursRepo: BusinessHoursRepository;
  private storeSettingsRepo: StoreSettingsRepository;
  private appointmentSettingsRepo: AppointmentSettingsRepository;

  constructor(useServiceRole = false) {
    this.businessHoursRepo = new BusinessHoursRepository(useServiceRole);
    this.storeSettingsRepo = new StoreSettingsRepository(useServiceRole);
    this.appointmentSettingsRepo = new AppointmentSettingsRepository(useServiceRole);
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    const [businessHours, storeSettings, appointmentSettings] = await Promise.all([
      this.businessHoursRepo.getAll(),
      this.storeSettingsRepo.get(),
      this.appointmentSettingsRepo.get()
    ]);

    return {
      businessHours,
      storeSettings,
      appointmentSettings
    };
  }

  /**
   * Update business hours for a specific day
   */
  async updateBusinessHours(dayOfWeek: number, hours: Partial<BusinessHours>) {
    return this.businessHoursRepo.updateDay(dayOfWeek, hours);
  }

  /**
   * Update all business hours
   */
  async updateAllBusinessHours(hours: Partial<BusinessHours>[]) {
    return this.businessHoursRepo.bulkUpdate(hours);
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(settings: Partial<StoreSettings>) {
    return this.storeSettingsRepo.upsert(settings);
  }

  /**
   * Update appointment settings
   */
  async updateAppointmentSettings(settings: Partial<AppointmentSettings>) {
    return this.appointmentSettingsRepo.upsert(settings);
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(updates: SettingsUpdate) {
    const results: any = {};

    if (updates.businessHours) {
      results.businessHours = await this.updateAllBusinessHours(updates.businessHours);
    }

    if (updates.storeSettings) {
      results.storeSettings = await this.updateStoreSettings(updates.storeSettings);
    }

    if (updates.appointmentSettings) {
      results.appointmentSettings = await this.updateAppointmentSettings(updates.appointmentSettings);
    }

    return results;
  }

  /**
   * Generate appointment slots based on business hours
   */
  async generateAppointmentSlots(date: string) {
    const dayOfWeek = new Date(date).getDay();
    const businessHours = await this.businessHoursRepo.getAll();
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!dayHours || !dayHours.is_active || !dayHours.open_time || !dayHours.close_time) {
      return [];
    }

    const appointmentSettings = await this.appointmentSettingsRepo.get();
    const slotDuration = appointmentSettings?.slot_duration_minutes || 30;
    const bufferTime = appointmentSettings?.buffer_time_minutes || 0;

    // Generate slots based on business hours and settings
    const slots = [];
    const openTime = new Date(`${date}T${dayHours.open_time}`);
    const closeTime = new Date(`${date}T${dayHours.close_time}`);
    const breakStart = dayHours.break_start ? new Date(`${date}T${dayHours.break_start}`) : null;
    const breakEnd = dayHours.break_end ? new Date(`${date}T${dayHours.break_end}`) : null;

    let currentTime = new Date(openTime);
    
    while (currentTime < closeTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      
      // Skip if slot overlaps with break time
      if (breakStart && breakEnd) {
        if (
          (currentTime >= breakStart && currentTime < breakEnd) ||
          (slotEnd > breakStart && slotEnd <= breakEnd)
        ) {
          currentTime = new Date(breakEnd.getTime() + bufferTime * 60000);
          continue;
        }
      }

      // Only add slot if it fits within business hours
      if (slotEnd <= closeTime) {
        slots.push({
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          isAvailable: true
        });
      }

      currentTime = new Date(slotEnd.getTime() + bufferTime * 60000);
    }

    return slots;
  }
}