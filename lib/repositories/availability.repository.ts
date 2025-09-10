import { BaseRepository } from './base.repository';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

type BusinessHours = Database['public']['Tables']['business_hours']['Row'];
type AppointmentSlot = Database['public']['Tables']['appointment_slots']['Row'];
type StaffAvailability = Database['public']['Tables']['staff_availability']['Row'];
type SpecialDate = Database['public']['Tables']['special_dates']['Row'];

export interface TimeSlot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId?: string;
  staffName?: string;
  isAvailable: boolean;
  capacity?: number;
  currentCapacity?: number;
}

export interface DayAvailability {
  date: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  specialHours?: boolean;
  slots: TimeSlot[];
}

export class AvailabilityRepository extends BaseRepository<AppointmentSlot> {
  constructor(useServiceRole = false) {
    super('appointment_slots', useServiceRole);
  }

  /**
   * Get business hours for a specific day
   */
  async getBusinessHours(dayOfWeek: number): Promise<BusinessHours | null> {
    const client = await this.getClient();
    const query = client
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business hours:', error);
      return null;
    }
    return data;
  }

  /**
   * Get all business hours
   */
  async getAllBusinessHours(): Promise<BusinessHours[]> {
    const client = await this.getClient();
    const query = client
      .from('business_hours')
      .select('*')
      .order('day_of_week');

    return this.handleResponse(query);
  }

  /**
   * Check if a specific date has special hours or is closed
   */
  async getSpecialDate(date: string): Promise<SpecialDate | null> {
    const client = await this.getClient();
    const query = client
      .from('special_dates')
      .select('*')
      .eq('date', date)
      .single();

    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching special date:', error);
      return null;
    }
    return data;
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const client = await this.getClient();
    const query = client
      .from('appointment_slots')
      .select(`
        id,
        date,
        start_time,
        end_time,
        duration_minutes,
        staff_id,
        is_available,
        max_capacity,
        current_capacity,
        users:staff_id (
          id,
          full_name
        )
      `)
      .eq('date', date)
      .eq('is_available', true)
      .order('start_time');

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }

    return (data || []).map(slot => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      staffId: slot.staff_id,
      staffName: slot.users?.full_name,
      isAvailable: slot.is_available,
      capacity: slot.max_capacity,
      currentCapacity: slot.current_capacity
    }));
  }

  /**
   * Get available slots for a date range
   */
  async getAvailableSlotsRange(startDate: string, endDate: string): Promise<Record<string, TimeSlot[]>> {
    const query = this.supabase
      .from('appointment_slots')
      .select(`
        id,
        date,
        start_time,
        end_time,
        duration_minutes,
        staff_id,
        is_available,
        max_capacity,
        current_capacity,
        users:staff_id (
          id,
          full_name
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_available', true)
      .lt('current_capacity', this.supabase.raw('max_capacity'))
      .order('date')
      .order('start_time');

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching slots range:', error);
      return {};
    }

    // Group slots by date
    const slotsByDate: Record<string, TimeSlot[]> = {};
    (data || []).forEach(slot => {
      const dateKey = slot.date;
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push({
        id: slot.id,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        staffId: slot.staff_id,
        staffName: slot.users?.full_name,
        isAvailable: slot.is_available,
        capacity: slot.max_capacity,
        currentCapacity: slot.current_capacity
      });
    });

    return slotsByDate;
  }

  /**
   * Get staff availability for a specific date
   */
  async getStaffAvailability(date: string): Promise<StaffAvailability[]> {
    const query = this.supabase
      .from('staff_availability')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          role
        )
      `)
      .eq('date', date)
      .eq('is_available', true);

    return this.handleResponse(query);
  }

  /**
   * Generate appointment slots for a date
   */
  async generateSlotsForDate(date: string, slotDuration: number = 30): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.rpc('generate_appointment_slots', {
      p_date: date,
      p_slot_duration: slotDuration
    });

    if (error) {
      console.error('Error generating slots:', error);
      // Don't throw - just log the error since the function might not exist yet
    }
  }

  /**
   * Reserve a time slot
   */
  async reserveSlot(slotId: string, appointmentId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('appointment_slots')
      .update({
        appointment_id: appointmentId,
        is_available: false,
        current_capacity: this.supabase.raw('current_capacity + 1')
      })
      .eq('id', slotId)
      .eq('is_available', true);

    if (error) {
      console.error('Error reserving slot:', error);
      return false;
    }
    return true;
  }

  /**
   * Release a time slot (e.g., when appointment is cancelled)
   */
  async releaseSlot(slotId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('appointment_slots')
      .update({
        appointment_id: null,
        is_available: true,
        current_capacity: this.supabase.raw('GREATEST(0, current_capacity - 1)')
      })
      .eq('id', slotId);

    if (error) {
      console.error('Error releasing slot:', error);
      return false;
    }
    return true;
  }

  /**
   * Get comprehensive availability for a date including business hours and special dates
   */
  async getDayAvailability(date: string): Promise<DayAvailability> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Check for special date first
    const specialDate = await this.getSpecialDate(date);
    
    // If it's a closure, return closed status
    if (specialDate?.type === 'closure') {
      return {
        date,
        dayOfWeek,
        isOpen: false,
        specialHours: true,
        slots: []
      };
    }

    // Get business hours or special hours
    let openTime: string | undefined;
    let closeTime: string | undefined;
    let breakStart: string | undefined;
    let breakEnd: string | undefined;
    let isOpen = true;

    if (specialDate?.type === 'special_hours') {
      openTime = specialDate.open_time || undefined;
      closeTime = specialDate.close_time || undefined;
    } else {
      const businessHours = await this.getBusinessHours(dayOfWeek);
      if (businessHours && businessHours.is_active) {
        openTime = businessHours.open_time;
        closeTime = businessHours.close_time;
        breakStart = businessHours.break_start || undefined;
        breakEnd = businessHours.break_end || undefined;
      } else {
        isOpen = false;
      }
    }

    // Get available slots
    const slots = isOpen ? await this.getAvailableSlots(date) : [];

    return {
      date,
      dayOfWeek,
      isOpen,
      openTime,
      closeTime,
      breakStart,
      breakEnd,
      specialHours: !!specialDate,
      slots
    };
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(dayOfWeek: number, hours: Partial<BusinessHours>): Promise<BusinessHours | null> {
    const { data, error } = await this.supabase
      .from('business_hours')
      .update(hours)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single();

    if (error) {
      console.error('Error updating business hours:', error);
      return null;
    }
    return data;
  }

  /**
   * Add a special date (holiday, closure, or special hours)
   */
  async addSpecialDate(specialDate: Omit<SpecialDate, 'id' | 'created_at' | 'updated_at'>): Promise<SpecialDate | null> {
    const { data, error } = await this.supabase
      .from('special_dates')
      .insert(specialDate)
      .select()
      .single();

    if (error) {
      console.error('Error adding special date:', error);
      return null;
    }
    return data;
  }

  /**
   * Remove a special date
   */
  async removeSpecialDate(date: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('special_dates')
      .delete()
      .eq('date', date);

    if (error) {
      console.error('Error removing special date:', error);
      return false;
    }
    return true;
  }
}