'use client';

import { QueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Order } from '@/components/orders/orders-columns';

/**
 * Centralized Real-Time Service
 * Manages all Supabase real-time subscriptions with direct cache updates
 * No invalidation - only direct cache manipulation for instant updates
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase: SupabaseClient;
  private queryClient: QueryClient;
  private isConnected: boolean = false;

  private constructor(supabase: SupabaseClient, queryClient: QueryClient) {
    this.supabase = supabase;
    this.queryClient = queryClient;
  }

  static getInstance(supabase: SupabaseClient, queryClient: QueryClient): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService(supabase, queryClient);
    }
    return RealtimeService.instance;
  }

  // ============================================
  // TICKETS/ORDERS SUBSCRIPTIONS
  // ============================================

  subscribeToTickets() {
    const channelName = 'tickets-realtime';
    
    // Clean up existing subscription
    this.unsubscribe(channelName);

    const channel = this.supabase
      .channel(channelName)
      // Listen to repair_tickets changes
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'repair_tickets' },
        (payload) => this.handleTicketInsert(payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'repair_tickets' },
        (payload) => this.handleTicketUpdate(payload)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'repair_tickets' },
        (payload) => this.handleTicketDelete(payload)
      )
      // Listen to time_entries changes (affects ticket totals)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'time_entries' },
        (payload) => this.handleTimeEntryInsert(payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'time_entries' },
        (payload) => this.handleTimeEntryUpdate(payload)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'time_entries' },
        (payload) => this.handleTimeEntryDelete(payload)
      )
      .subscribe((status) => {
        console.log(`📡 Tickets real-time subscription: ${status}`);
        this.isConnected = status === 'SUBSCRIBED';
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  private async handleTicketInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🆕 New ticket created:', payload.new.ticket_number);
    
    // Fetch full ticket data with relationships
    try {
      const response = await fetch(`/api/orders/${payload.new.id}`);
      if (response.ok) {
        const fullTicket = await response.json();
        
        // Transform to Order format
        const newOrder: Order = {
          id: fullTicket.id,
          ticket_number: fullTicket.ticket_number,
          customer_id: fullTicket.customer_id,
          customer_name: fullTicket.customers?.name || "Unknown Customer",
          customer_phone: fullTicket.customers?.phone || "",
          device_brand: fullTicket.device?.manufacturer?.name || fullTicket.device_brand || "",
          device_model: fullTicket.device?.model_name || fullTicket.device_model || "",
          repair_issues: fullTicket.repair_issues || [],
          status: fullTicket.status,
          created_at: fullTicket.created_at,
          updated_at: fullTicket.updated_at,
          timer_total_minutes: fullTicket.total_time_minutes || 0,
        };
        
        // Update all ticket list queries - add to beginning
        this.queryClient.setQueriesData(
          { queryKey: ['tickets'], exact: false },
          (old: Order[] = []) => {
            // Check if already exists to prevent duplicates
            if (old.find(t => t.id === newOrder.id)) return old;
            return [newOrder, ...old];
          }
        );

        // Update dashboard counts
        this.updateDashboardCounts('tickets', 'increment');
      }
    } catch (error) {
      console.error('Error fetching new ticket data:', error);
    }
  }

  private handleTicketUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🔄 Ticket updated:', payload.new.ticket_number);
    
    const updated = payload.new;
    const old = payload.old;
    
    // Update all ticket list queries
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (oldData: Order[] = []) => {
        return oldData.map(ticket => {
          if (ticket.id === updated.id) {
            return {
              ...ticket,
              status: updated.status,
              updated_at: updated.updated_at,
              timer_is_running: updated.timer_is_running,
              timer_started_at: updated.timer_started_at,
              timer_total_minutes: updated.timer_total_minutes || ticket.timer_total_minutes,
              // Preserve customer/device info unless specifically updated
              customer_id: updated.customer_id || ticket.customer_id,
              device_brand: updated.device_brand || ticket.device_brand,
              device_model: updated.device_model || ticket.device_model,
              repair_issues: updated.repair_issues || ticket.repair_issues,
            };
          }
          return ticket;
        });
      }
    );
    
    // Update individual ticket query
    this.queryClient.setQueryData(['ticket', updated.id], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        ...updated,
      };
    });

    // Update dashboard if status changed
    if (old.status !== updated.status) {
      this.updateDashboardStatus('tickets', old.status, updated.status);
    }
  }

  private handleTicketDelete(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🗑️ Ticket deleted:', payload.old.id);
    
    // Remove from all ticket list queries
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (old: Order[] = []) => {
        return old.filter(ticket => ticket.id !== payload.old.id);
      }
    );
    
    // Remove individual ticket query
    this.queryClient.removeQueries({ queryKey: ['ticket', payload.old.id] });

    // Update dashboard counts
    this.updateDashboardCounts('tickets', 'decrement');
  }

  // ============================================
  // TIME ENTRIES SUBSCRIPTIONS
  // ============================================

  private async handleTimeEntryInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('⏱️ New time entry added:', payload.new.id);
    
    const ticketId = payload.new.ticket_id;
    const duration = payload.new.duration_minutes || 0;
    
    // Create a full time entry object with user info
    // For now, just use the payload data as-is
    // The user info should come from the API when the timer stops
    const newEntry = payload.new;
    
    // Update ticket's total time in all list views
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (old: Order[] = []) => {
        return old.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              timer_total_minutes: (ticket.timer_total_minutes || 0) + duration,
              updated_at: new Date().toISOString(), // Update last activity
            };
          }
          return ticket;
        });
      }
    );

    // Update individual ticket with new time entry in the array
    this.queryClient.setQueryData(['ticket', ticketId], (old: any) => {
      if (!old) return old;
      
      // Add the new time entry to the time_entries array
      const updatedTimeEntries = [...(old.time_entries || []), newEntry];
      
      return {
        ...old,
        time_entries: updatedTimeEntries,
        timer_total_minutes: (old.timer_total_minutes || 0) + duration,
        total_time_minutes: (old.total_time_minutes || 0) + duration,
        updated_at: new Date().toISOString(),
      };
    });

    // Update standalone time entries query if it exists
    this.queryClient.setQueryData(['time-entries', ticketId], (old: any[] = []) => {
      return [...old, newEntry];
    });
  }

  private handleTimeEntryUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('⏱️ Time entry updated:', payload.new.id);
    
    const ticketId = payload.new.ticket_id;
    const oldDuration = payload.old.duration_minutes || 0;
    const newDuration = payload.new.duration_minutes || 0;
    const difference = newDuration - oldDuration;
    
    // Update ticket's total time
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (old: Order[] = []) => {
        return old.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              timer_total_minutes: (ticket.timer_total_minutes || 0) + difference,
              updated_at: new Date().toISOString(),
            };
          }
          return ticket;
        });
      }
    );

    // Update individual ticket and its time_entries array
    this.queryClient.setQueryData(['ticket', ticketId], (old: any) => {
      if (!old) return old;
      
      // Update the specific time entry in the array
      const updatedTimeEntries = (old.time_entries || []).map((entry: any) => 
        entry.id === payload.new.id ? { ...entry, ...payload.new } : entry
      );
      
      return {
        ...old,
        time_entries: updatedTimeEntries,
        timer_total_minutes: (old.timer_total_minutes || 0) + difference,
        total_time_minutes: (old.total_time_minutes || 0) + difference,
        updated_at: new Date().toISOString(),
      };
    });

    // Update standalone time entries query
    this.queryClient.setQueryData(['time-entries', ticketId], (old: any[] = []) => {
      return old.map(entry => 
        entry.id === payload.new.id ? { ...entry, ...payload.new } : entry
      );
    });
  }

  private handleTimeEntryDelete(payload: RealtimePostgresChangesPayload<any>) {
    console.log('⏱️ Time entry deleted:', payload.old.id);
    
    const ticketId = payload.old.ticket_id;
    const duration = payload.old.duration_minutes || 0;
    
    // Update ticket's total time
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (old: Order[] = []) => {
        return old.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              timer_total_minutes: Math.max(0, (ticket.timer_total_minutes || 0) - duration),
              updated_at: new Date().toISOString(),
            };
          }
          return ticket;
        });
      }
    );

    // Update individual ticket and remove from time_entries array
    this.queryClient.setQueryData(['ticket', ticketId], (old: any) => {
      if (!old) return old;
      
      // Remove the deleted time entry from the array
      const updatedTimeEntries = (old.time_entries || []).filter(
        (entry: any) => entry.id !== payload.old.id
      );
      
      return {
        ...old,
        time_entries: updatedTimeEntries,
        timer_total_minutes: Math.max(0, (old.timer_total_minutes || 0) - duration),
        total_time_minutes: Math.max(0, (old.total_time_minutes || 0) - duration),
        updated_at: new Date().toISOString(),
      };
    });

    // Update standalone time entries query
    this.queryClient.setQueryData(['time-entries', ticketId], (old: any[] = []) => {
      return old.filter(entry => entry.id !== payload.old.id);
    });
  }

  // ============================================
  // CUSTOMERS SUBSCRIPTIONS
  // ============================================

  subscribeToCustomers() {
    const channelName = 'customers-realtime';
    
    this.unsubscribe(channelName);

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customers' },
        (payload) => this.handleCustomerInsert(payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers' },
        (payload) => this.handleCustomerUpdate(payload)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'customers' },
        (payload) => this.handleCustomerDelete(payload)
      )
      .subscribe((status) => {
        console.log(`📡 Customers real-time subscription: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  private handleCustomerInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('👤 New customer created:', payload.new.name);
    
    // Add to all customer list queries
    this.queryClient.setQueriesData(
      { queryKey: ['customers'], exact: false },
      (old: any) => {
        // Handle both array and object with data property
        if (Array.isArray(old)) {
          if (old.find((c: any) => c.id === payload.new.id)) return old;
          return [payload.new, ...old];
        } else if (old?.data && Array.isArray(old.data)) {
          if (old.data.find((c: any) => c.id === payload.new.id)) return old;
          return {
            ...old,
            data: [payload.new, ...old.data]
          };
        }
        return old;
      }
    );

    // Update dashboard counts
    this.updateDashboardCounts('customers', 'increment');
  }

  private handleCustomerUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('👤 Customer updated:', payload.new.name);
    
    // Update all customer list queries
    this.queryClient.setQueriesData(
      { queryKey: ['customers'], exact: false },
      (old: any) => {
        // Handle both array and object with data property
        if (Array.isArray(old)) {
          return old.map((customer: any) => 
            customer.id === payload.new.id ? { ...customer, ...payload.new } : customer
          );
        } else if (old?.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((customer: any) => 
              customer.id === payload.new.id ? { ...customer, ...payload.new } : customer
            )
          };
        }
        return old;
      }
    );

    // Update individual customer query
    this.queryClient.setQueryData(['customer', payload.new.id], (old: any) => {
      if (!old) return old;
      return { ...old, ...payload.new };
    });
  }

  private handleCustomerDelete(payload: RealtimePostgresChangesPayload<any>) {
    console.log('👤 Customer deleted:', payload.old.id);
    
    // Remove from all customer list queries
    this.queryClient.setQueriesData(
      { queryKey: ['customers'], exact: false },
      (old: any) => {
        // Handle both array and object with data property
        if (Array.isArray(old)) {
          return old.filter((customer: any) => customer.id !== payload.old.id);
        } else if (old?.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.filter((customer: any) => customer.id !== payload.old.id)
          };
        }
        return old;
      }
    );

    // Remove individual customer query
    this.queryClient.removeQueries({ queryKey: ['customer', payload.old.id] });

    // Update dashboard counts
    this.updateDashboardCounts('customers', 'decrement');
  }

  // ============================================
  // APPOINTMENTS SUBSCRIPTIONS
  // ============================================

  subscribeToAppointments() {
    const channelName = 'appointments-realtime';
    
    this.unsubscribe(channelName);

    const channel = this.supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => this.handleAppointmentInsert(payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => this.handleAppointmentUpdate(payload)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        (payload) => this.handleAppointmentDelete(payload)
      )
      .subscribe((status) => {
        console.log(`📡 Appointments real-time subscription: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  private async handleAppointmentInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📅 New appointment created:', payload.new.appointment_number);
    
    // Fetch full appointment data with relationships
    try {
      const { data: fullAppointment, error } = await this.supabase
        .from('appointments')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          devices (
            id,
            model_name,
            manufacturer:manufacturers (
              name
            )
          ),
          customer_devices (
            id,
            serial_number,
            imei,
            color,
            storage_size
          )
        `)
        .eq('id', payload.new.id)
        .single();

      if (error) throw error;

      // Transform to match the appointments list format
      const appointmentData = {
        id: fullAppointment.id,
        appointment_number: fullAppointment.appointment_number,
        customer_name: fullAppointment.customers?.name || "Walk-in",
        customer_email: fullAppointment.customers?.email || "",
        customer_phone: fullAppointment.customers?.phone || "",
        device: fullAppointment.devices ? 
          `${fullAppointment.devices.manufacturer?.name || ''} ${fullAppointment.devices.model_name}` : 
          "Not specified",
        scheduled_date: fullAppointment.scheduled_date,
        scheduled_time: fullAppointment.scheduled_time,
        duration_minutes: fullAppointment.duration_minutes,
        status: fullAppointment.status,
        issues: fullAppointment.issues || [],
        urgency: fullAppointment.urgency,
        source: fullAppointment.source,
        created_at: fullAppointment.created_at,
        converted_to_ticket_id: fullAppointment.converted_to_ticket_id,
      };
      
      // Add to all appointment list queries with full data
      this.queryClient.setQueriesData(
        { queryKey: ['appointments'], exact: false },
        (old: any[] = []) => {
          if (old.find(a => a.id === appointmentData.id)) return old;
          return [appointmentData, ...old];
        }
      );

      // Update dashboard counts
      this.updateDashboardCounts('appointments', 'increment');
    } catch (error) {
      console.error('Error fetching new appointment data:', error);
      // Fallback to basic data if fetch fails
      this.queryClient.setQueriesData(
        { queryKey: ['appointments'], exact: false },
        (old: any[] = []) => {
          if (old.find(a => a.id === payload.new.id)) return old;
          return [payload.new, ...old];
        }
      );
    }
  }

  private handleAppointmentUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📅 Appointment updated:', payload.new.appointment_number);
    
    // Update all appointment list queries, preserving customer and device data
    this.queryClient.setQueriesData(
      { queryKey: ['appointments'], exact: false },
      (old: any[] = []) => {
        return old.map(appointment => {
          if (appointment.id === payload.new.id) {
            // Preserve customer and device display data
            return {
              ...appointment,
              // Update only the fields from payload, keep formatted customer/device data
              scheduled_date: payload.new.scheduled_date,
              scheduled_time: payload.new.scheduled_time,
              duration_minutes: payload.new.duration_minutes,
              status: payload.new.status,
              issues: payload.new.issues || appointment.issues,
              urgency: payload.new.urgency,
              source: payload.new.source,
              notes: payload.new.notes,
              converted_to_ticket_id: payload.new.converted_to_ticket_id,
              updated_at: payload.new.updated_at,
              // Keep existing customer and device display fields
              customer_name: appointment.customer_name,
              customer_email: appointment.customer_email,
              customer_phone: appointment.customer_phone,
              device: appointment.device,
            };
          }
          return appointment;
        });
      }
    );

    // Update individual appointment query
    this.queryClient.setQueryData(['appointment', payload.new.id], (old: any) => {
      if (!old) return old;
      return { ...old, ...payload.new };
    });

    // Update dashboard if status changed
    if (payload.old.status !== payload.new.status) {
      this.updateDashboardStatus('appointments', payload.old.status, payload.new.status);
    }
  }

  private handleAppointmentDelete(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📅 Appointment deleted:', payload.old.id);
    
    // Remove from all appointment list queries
    this.queryClient.setQueriesData(
      { queryKey: ['appointments'], exact: false },
      (old: any[] = []) => {
        return old.filter(appointment => appointment.id !== payload.old.id);
      }
    );

    // Remove individual appointment query
    this.queryClient.removeQueries({ queryKey: ['appointment', payload.old.id] });

    // Update dashboard counts
    this.updateDashboardCounts('appointments', 'decrement');
  }

  // ============================================
  // ADMIN SUBSCRIPTIONS
  // ============================================

  subscribeToAdmin() {
    const tables = ['users', 'devices', 'services', 'media_library'];
    
    tables.forEach(table => {
      const channelName = `${table}-realtime`;
      this.unsubscribe(channelName);

      const channel = this.supabase
        .channel(channelName)
        .on('postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => this.handleAdminTableChange(table, payload)
        )
        .subscribe((status) => {
          console.log(`📡 ${table} real-time subscription: ${status}`);
        });

      this.channels.set(channelName, channel);
    });
  }

  private handleAdminTableChange(table: string, payload: RealtimePostgresChangesPayload<any>) {
    // Map table names to their query keys
    const tableToQueryKey: Record<string, string> = {
      'users': 'users',
      'devices': 'devices', 
      'services': 'services',
      'media_library': 'media'
    };
    
    const queryKeyPart = tableToQueryKey[table] || table;
    
    switch (payload.eventType) {
      case 'INSERT':
        console.log(`🆕 New ${table} record:`, payload.new.id);
        this.queryClient.setQueriesData(
          { queryKey: ['admin', queryKeyPart], exact: false },
          (old: any[] = []) => {
            if (old.find(item => item.id === payload.new.id)) return old;
            return [payload.new, ...old];
          }
        );
        break;
        
      case 'UPDATE':
        console.log(`🔄 ${table} updated:`, payload.new.id);
        this.queryClient.setQueriesData(
          { queryKey: ['admin', queryKeyPart], exact: false },
          (old: any[] = []) => {
            return old.map(item => 
              item.id === payload.new.id ? { ...item, ...payload.new } : item
            );
          }
        );
        break;
        
      case 'DELETE':
        console.log(`🗑️ ${table} deleted:`, payload.old.id);
        this.queryClient.setQueriesData(
          { queryKey: ['admin', queryKeyPart], exact: false },
          (old: any[] = []) => {
            return old.filter(item => item.id !== payload.old.id);
          }
        );
        break;
    }
  }

  // ============================================
  // DASHBOARD HELPERS
  // ============================================

  private updateDashboardCounts(entity: string, operation: 'increment' | 'decrement') {
    this.queryClient.setQueryData(['dashboard'], (old: any) => {
      if (!old) return old;
      
      const key = `total_${entity}`;
      const currentCount = old[key] || 0;
      
      return {
        ...old,
        [key]: operation === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1),
      };
    });
  }

  private updateDashboardStatus(entity: string, oldStatus: string, newStatus: string) {
    this.queryClient.setQueryData(['dashboard'], (old: any) => {
      if (!old) return old;
      
      // Update status-specific counts if they exist
      const oldKey = `${entity}_${oldStatus}`;
      const newKey = `${entity}_${newStatus}`;
      
      const updates: any = {};
      
      if (old[oldKey] !== undefined) {
        updates[oldKey] = Math.max(0, old[oldKey] - 1);
      }
      
      if (old[newKey] !== undefined) {
        updates[newKey] = old[newKey] + 1;
      }
      
      return { ...old, ...updates };
    });
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from ${name}`);
    });
    this.channels.clear();
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}