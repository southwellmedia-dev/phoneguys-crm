import { AvailabilityRepository, type TimeSlot, type DayAvailability } from '@/lib/repositories/availability.repository';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { format, addDays, startOfWeek, endOfWeek, isBefore, isAfter, parseISO } from 'date-fns';

export interface AvailabilityOptions {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  duration?: number;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  isAvailable: boolean;
  availableSlots: number;
  slots?: TimeSlot[];
}

export interface WeekAvailability {
  weekStart: string;
  weekEnd: string;
  days: CalendarDay[];
}

export class AvailabilityService {
  private availabilityRepo: AvailabilityRepository;
  private appointmentRepo: AppointmentRepository;

  constructor(useServiceRole = false, usePublicClient = false) {
    this.availabilityRepo = new AvailabilityRepository(useServiceRole, usePublicClient);
    this.appointmentRepo = new AppointmentRepository(useServiceRole, usePublicClient);
  }

  /**
   * Get availability for a specific date
   */
  async getDateAvailability(date: string): Promise<DayAvailability> {
    // Ensure slots are generated for this date
    await this.ensureSlotsGenerated(date);
    
    // Get comprehensive availability
    return this.availabilityRepo.getDayAvailability(date);
  }

  /**
   * Get availability for a week
   */
  async getWeekAvailability(startDate: string): Promise<WeekAvailability> {
    const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(parseISO(startDate), { weekStartsOn: 1 });
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate slots for the entire week
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(start, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      await this.ensureSlotsGenerated(dateStr);
    }

    // Get all slots for the week
    const weekSlots = await this.availabilityRepo.getAvailableSlotsRange(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );

    // Build calendar days
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(start, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayAvailability = await this.availabilityRepo.getDayAvailability(dateStr);
      const slots = weekSlots[dateStr] || [];

      days.push({
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        isToday: currentDate.getTime() === today.getTime(),
        isPast: isBefore(currentDate, today),
        isAvailable: dayAvailability.isOpen && !isBefore(currentDate, today) && slots.length > 0,
        availableSlots: slots.length,
        slots: slots
      });
    }

    return {
      weekStart: format(start, 'yyyy-MM-dd'),
      weekEnd: format(end, 'yyyy-MM-dd'),
      days
    };
  }

  /**
   * Get availability for a month
   */
  async getMonthAvailability(year: number, month: number): Promise<Record<string, CalendarDay>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthData: Record<string, CalendarDay> = {};

    // Get all slots for the month
    const monthSlots = await this.availabilityRepo.getAvailableSlotsRange(
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    );

    // Build data for each day
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const slots = monthSlots[dateStr] || [];

      // Check if day is open
      const dayAvailability = await this.availabilityRepo.getDayAvailability(dateStr);

      monthData[dateStr] = {
        date: dateStr,
        dayOfWeek: currentDate.getDay(),
        isToday: currentDate.getTime() === today.getTime(),
        isPast: isBefore(currentDate, today),
        isAvailable: dayAvailability.isOpen && !isBefore(currentDate, today) && slots.length > 0,
        availableSlots: slots.length
      };
    }

    return monthData;
  }

  /**
   * Get next available dates with slots
   * OPTIMIZED VERSION: Uses batch operations to minimize database queries
   */
  async getNextAvailableDates(limit: number = 7): Promise<CalendarDay[]> {
    // Use the optimized batch method
    const result = await this.availabilityRepo.getNextAvailableDatesOptimized(limit);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Transform the optimized results to CalendarDay format
    const availableDates: CalendarDay[] = result.dates.map(dateInfo => {
      const dateObj = new Date(dateInfo.date);
      return {
        date: dateInfo.date,
        dayOfWeek: dateInfo.dayOfWeek,
        isToday: dateObj.getTime() === today.getTime(),
        isPast: false,
        isAvailable: dateInfo.isAvailable,
        availableSlots: dateInfo.availableSlots,
        // Note: We don't fetch individual slots here for performance
        // They can be fetched when a specific date is selected
        slots: undefined
      };
    });

    // Log performance improvement
    console.log(`[Performance] getNextAvailableDates completed with ${result.totalQueries} queries (previously ~${limit * 3} queries)`);

    return availableDates;
  }

  /**
   * Get next available dates with slots - LEGACY VERSION
   * Kept for reference but should not be used
   */
  private async getNextAvailableDatesLegacy(limit: number = 7): Promise<CalendarDay[]> {
    const availableDates: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = new Date(today);
    let daysChecked = 0;
    const maxDaysToCheck = 60; // Don't check more than 60 days ahead

    while (availableDates.length < limit && daysChecked < maxDaysToCheck) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Ensure slots are generated
      await this.ensureSlotsGenerated(dateStr);
      
      // Get availability
      const dayAvailability = await this.availabilityRepo.getDayAvailability(dateStr);
      const slots = await this.availabilityRepo.getAvailableSlots(dateStr);

      if (dayAvailability.isOpen && slots.length > 0) {
        availableDates.push({
          date: dateStr,
          dayOfWeek: currentDate.getDay(),
          isToday: currentDate.getTime() === today.getTime(),
          isPast: false,
          isAvailable: true,
          availableSlots: slots.length,
          slots: slots
        });
      }

      currentDate = addDays(currentDate, 1);
      daysChecked++;
    }

    return availableDates;
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(date: string, time: string, duration: number = 30): Promise<boolean> {
    const slots = await this.availabilityRepo.getAvailableSlots(date);
    
    // Normalize time formats for comparison (handle both HH:MM and HH:MM:SS)
    const normalizeTime = (t: string) => {
      if (t.includes(':') && t.split(':').length === 3) {
        return t.substring(0, 5); // Convert HH:MM:SS to HH:MM
      }
      return t;
    };
    
    const normalizedInputTime = normalizeTime(time);
    
    return slots.some(slot => {
      const normalizedSlotTime = normalizeTime(slot.startTime);
      return normalizedSlotTime === normalizedInputTime && slot.isAvailable;
    });
  }

  /**
   * Reserve a time slot for an appointment
   */
  async reserveSlot(date: string, time: string, appointmentId: string): Promise<boolean> {
    // Find the slot
    const slots = await this.availabilityRepo.getAvailableSlots(date);
    
    // Normalize time formats for comparison
    const normalizeTime = (t: string) => {
      if (t.includes(':') && t.split(':').length === 3) {
        return t.substring(0, 5); // Convert HH:MM:SS to HH:MM
      }
      return t;
    };
    
    const normalizedInputTime = normalizeTime(time);
    const slot = slots.find(s => {
      const normalizedSlotTime = normalizeTime(s.startTime);
      return normalizedSlotTime === normalizedInputTime;
    });
    
    if (!slot || !slot.id) {
      console.error('Slot not found or unavailable');
      return false;
    }

    // Reserve the slot
    return this.availabilityRepo.reserveSlot(slot.id, appointmentId);
  }

  /**
   * Release a time slot (when appointment is cancelled)
   */
  async releaseSlot(appointmentId: string): Promise<boolean> {
    // Find the slot associated with this appointment
    const { data: slot } = await this.availabilityRepo.supabase
      .from('appointment_slots')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (!slot) {
      console.error('No slot found for appointment');
      return false;
    }

    return this.availabilityRepo.releaseSlot(slot.id);
  }

  /**
   * Ensure slots are generated for a specific date
   */
  private async ensureSlotsGenerated(date: string): Promise<void> {
    // Check if slots already exist for this date
    const existingSlots = await this.availabilityRepo.getAvailableSlots(date);
    
    // If no slots exist, generate them
    if (existingSlots.length === 0) {
      const dayAvailability = await this.availabilityRepo.getDayAvailability(date);
      if (dayAvailability.isOpen) {
        await this.availabilityRepo.generateSlotsForDate(date);
      }
    }
  }

  /**
   * Update business hours for a day of the week
   */
  async updateBusinessHours(dayOfWeek: number, hours: {
    openTime?: string;
    closeTime?: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    isActive?: boolean;
  }) {
    const formattedHours = {
      open_time: hours.openTime,
      close_time: hours.closeTime,
      break_start: hours.breakStart,
      break_end: hours.breakEnd,
      is_active: hours.isActive
    };

    return this.availabilityRepo.updateBusinessHours(dayOfWeek, formattedHours);
  }

  /**
   * Add a special date (holiday, closure, or special hours)
   */
  async addSpecialDate(date: string, type: 'holiday' | 'closure' | 'special_hours', options?: {
    name?: string;
    openTime?: string;
    closeTime?: string;
    notes?: string;
  }) {
    return this.availabilityRepo.addSpecialDate({
      date,
      type,
      name: options?.name,
      open_time: options?.openTime,
      close_time: options?.closeTime,
      notes: options?.notes
    });
  }

  /**
   * Remove a special date
   */
  async removeSpecialDate(date: string): Promise<boolean> {
    return this.availabilityRepo.removeSpecialDate(date);
  }

  /**
   * Get all business hours configuration
   */
  async getBusinessHours() {
    return this.availabilityRepo.getAllBusinessHours();
  }

  /**
   * Get suggested appointment times based on issue type and urgency
   */
  async getSuggestedTimes(options: {
    issueType?: string;
    urgency?: 'low' | 'normal' | 'high' | 'emergency';
    preferredDate?: string;
    duration?: number;
  }): Promise<TimeSlot[]> {
    const duration = options.duration || 30;
    const urgency = options.urgency || 'normal';
    
    // For emergency, get slots for today and tomorrow
    if (urgency === 'emergency') {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      
      const todaySlots = await this.availabilityRepo.getAvailableSlots(today);
      const tomorrowSlots = await this.availabilityRepo.getAvailableSlots(tomorrow);
      
      return [...todaySlots.slice(0, 3), ...tomorrowSlots.slice(0, 3)];
    }

    // For preferred date
    if (options.preferredDate) {
      const slots = await this.availabilityRepo.getAvailableSlots(options.preferredDate);
      return slots.slice(0, 5);
    }

    // Get next available dates
    const nextDates = await this.getNextAvailableDates(3);
    const suggestedSlots: TimeSlot[] = [];

    for (const day of nextDates) {
      if (day.slots) {
        suggestedSlots.push(...day.slots.slice(0, 2));
      }
    }

    return suggestedSlots.slice(0, 6); // Return up to 6 suggestions
  }
}