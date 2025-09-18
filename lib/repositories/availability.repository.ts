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
  constructor(useServiceRole = false, usePublicClient = false) {
    super('appointment_slots', useServiceRole, usePublicClient);
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

  /**
   * OPTIMIZED: Get business hours for a date range
   * Returns a map of date to business hours
   */
  async getBusinessHoursForDateRange(startDate: string, endDate: string): Promise<Map<string, BusinessHours | null>> {
    const client = await this.getClient();
    
    // Get all active business hours
    const { data: businessHours, error } = await client
      .from('business_hours')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching business hours:', error);
      return new Map();
    }

    // Create a map of day_of_week to business hours
    const hoursByDay = new Map<number, BusinessHours>();
    (businessHours || []).forEach(hours => {
      hoursByDay.set(hours.day_of_week, hours);
    });

    // Build result map for each date in range
    const result = new Map<string, BusinessHours | null>();
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      result.set(dateStr, hoursByDay.get(dayOfWeek) || null);
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * OPTIMIZED: Get special dates for a date range
   * Returns all special dates in the range
   */
  async getSpecialDatesForRange(startDate: string, endDate: string): Promise<Map<string, SpecialDate>> {
    const client = await this.getClient();
    
    const { data, error } = await client
      .from('special_dates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error fetching special dates:', error);
      return new Map();
    }

    const result = new Map<string, SpecialDate>();
    (data || []).forEach(specialDate => {
      result.set(specialDate.date, specialDate);
    });

    return result;
  }

  /**
   * OPTIMIZED: Get all slots for a date range in a single query
   * Returns slots grouped by date
   */
  async getAvailableSlotsForRange(startDate: string, endDate: string): Promise<Map<string, TimeSlot[]>> {
    const client = await this.getClient();
    
    const { data, error } = await client
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
      .order('date')
      .order('start_time');

    if (error) {
      console.error('Error fetching slots range:', error);
      return new Map();
    }

    // Group slots by date
    const slotsByDate = new Map<string, TimeSlot[]>();
    (data || []).forEach(slot => {
      const dateKey = slot.date;
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push({
        id: slot.id,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        staffId: slot.staff_id,
        staffName: slot.users?.full_name,
        isAvailable: slot.is_available && (slot.current_capacity < slot.max_capacity),
        capacity: slot.max_capacity,
        currentCapacity: slot.current_capacity
      });
    });

    return slotsByDate;
  }

  /**
   * OPTIMIZED: Generate slots for multiple dates at once
   * Uses a database function to generate slots in batch
   */
  async generateSlotsForDateRange(startDate: string, endDate: string, slotDuration: number = 30): Promise<void> {
    const client = await this.getClient();
    
    // Call optimized database function (we'll create this in migration)
    const { error } = await client.rpc('generate_slots_for_date_range', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_slot_duration: slotDuration
    });

    if (error) {
      console.error('Error generating slots for range:', error);
      // Fallback to individual generation if function doesn't exist
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        await this.generateSlotsForDate(dateStr, slotDuration);
        current.setDate(current.getDate() + 1);
      }
    }
  }

  /**
   * OPTIMIZED: Get next available dates with minimal queries
   * This method fetches everything needed in just a few queries
   */
  async getNextAvailableDatesOptimized(limit: number = 30): Promise<{
    dates: Array<{
      date: string;
      dayOfWeek: number;
      isAvailable: boolean;
      availableSlots: number;
      openTime?: string;
      closeTime?: string;
    }>;
    totalQueries: number;
  }> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60); // Look ahead 60 days max
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    let queryCount = 0;

    // Batch fetch 1: Business hours for all days
    const businessHours = await this.getBusinessHoursForDateRange(startStr, endStr);
    queryCount++;

    // Batch fetch 2: Special dates for the range
    const specialDates = await this.getSpecialDatesForRange(startStr, endStr);
    queryCount++;

    // Batch fetch 3: All existing slots for the range
    const allSlots = await this.getAvailableSlotsForRange(startStr, endStr);
    queryCount++;

    // Process and find available dates
    const availableDates: Array<{
      date: string;
      dayOfWeek: number;
      isAvailable: boolean;
      availableSlots: number;
      openTime?: string;
      closeTime?: string;
    }> = [];

    const current = new Date(startDate);
    
    while (availableDates.length < limit && current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      
      // Check special dates first
      const specialDate = specialDates.get(dateStr);
      
      if (specialDate?.type === 'closure') {
        // Skip closed days
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Get business hours or special hours
      let openTime: string | undefined;
      let closeTime: string | undefined;
      let isOpen = false;

      if (specialDate?.type === 'special_hours') {
        openTime = specialDate.open_time || undefined;
        closeTime = specialDate.close_time || undefined;
        isOpen = !!(openTime && closeTime);
      } else {
        const hours = businessHours.get(dateStr);
        if (hours) {
          openTime = hours.open_time;
          closeTime = hours.close_time;
          isOpen = true;
        }
      }

      // Count available slots
      const dateSlots = allSlots.get(dateStr) || [];
      const availableSlotCount = dateSlots.filter(s => s.isAvailable).length;

      if (isOpen && availableSlotCount > 0) {
        availableDates.push({
          date: dateStr,
          dayOfWeek,
          isAvailable: true,
          availableSlots: availableSlotCount,
          openTime,
          closeTime
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      dates: availableDates,
      totalQueries: queryCount
    };
  }
}