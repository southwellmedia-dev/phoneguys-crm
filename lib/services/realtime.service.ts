'use client';

import { QueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Order } from '@/components/orders/orders-columns';
import { TicketTransformer } from '@/lib/transformers/ticket.transformer';

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

  // Cache for preventing duplicate fetches
  private fetchCache = new Map<string, Promise<any>>();
  private cacheTimeout = 1000; // 1 second cache

  private async handleTicketInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🆕 New ticket created:', payload.new.ticket_number);
    
    // Check cache to prevent duplicate fetches
    const cacheKey = `insert-${payload.new.id}`;
    let fetchPromise = this.fetchCache.get(cacheKey);
    
    if (!fetchPromise) {
      // Use optimized real-time endpoint
      fetchPromise = fetch(`/api/orders/${payload.new.id}/realtime`)
        .then(res => res.ok ? res.json() : null);
      
      this.fetchCache.set(cacheKey, fetchPromise);
      
      // Clear cache after timeout
      setTimeout(() => this.fetchCache.delete(cacheKey), this.cacheTimeout);
    }
    
    try {
      const newOrder = await fetchPromise;
      
      if (newOrder) {
        
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

  // Debounce map for rapid updates
  private updateDebounce = new Map<string, NodeJS.Timeout>();
  private debounceDelay = 100; // 100ms debounce

  private handleTicketUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('🔄 Ticket updated:', payload.new.ticket_number);
    
    const ticketId = payload.new.id;
    
    // Clear existing debounce for this ticket
    const existingTimeout = this.updateDebounce.get(ticketId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Debounce rapid updates
    const timeout = setTimeout(() => {
      this.applyTicketUpdate(payload);
      this.updateDebounce.delete(ticketId);
    }, this.debounceDelay);
    
    this.updateDebounce.set(ticketId, timeout);
  }
  
  private applyTicketUpdate(payload: RealtimePostgresChangesPayload<any>) {
    const updated = payload.new;
    const old = payload.old;
    
    // Update all ticket list queries using transformer
    this.queryClient.setQueriesData(
      { queryKey: ['tickets'], exact: false },
      (oldData: Order[] = []) => {
        return oldData.map(ticket => {
          if (ticket.id === updated.id) {
            // Use transformer to merge updates consistently
            return TicketTransformer.mergeOrderUpdate(ticket, updated);
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
      // Listen to customer devices changes
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_devices' },
        (payload) => this.handleCustomerDeviceInsert(payload)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customer_devices' },
        (payload) => this.handleCustomerDeviceUpdate(payload)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'customer_devices' },
        (payload) => this.handleCustomerDeviceDelete(payload)
      )
      .subscribe((status) => {
        console.log(`📡 Customers real-time subscription: ${status}`);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  private async handleCustomerInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('👤 New customer created:', payload.new.name);
    
    // Check cache to prevent duplicate fetches
    const cacheKey = `customer-insert-${payload.new.id}`;
    let fetchPromise = this.fetchCache.get(cacheKey);
    
    if (!fetchPromise) {
      // Use optimized real-time endpoint
      fetchPromise = fetch(`/api/customers/${payload.new.id}/realtime`)
        .then(res => res.ok ? res.json() : null);
      
      this.fetchCache.set(cacheKey, fetchPromise);
      setTimeout(() => this.fetchCache.delete(cacheKey), this.cacheTimeout);
    }
    
    try {
      const customerData = await fetchPromise;
      
      if (customerData) {
        // Add to all customer list queries
        this.queryClient.setQueriesData(
          { queryKey: ['customers'], exact: false },
          (old: any) => {
            // Handle both array and object with data property
            if (Array.isArray(old)) {
              if (old.find((c: any) => c.id === customerData.id)) return old;
              return [customerData, ...old];
            } else if (old?.data && Array.isArray(old.data)) {
              if (old.data.find((c: any) => c.id === customerData.id)) return old;
              return {
                ...old,
                data: [customerData, ...old.data]
              };
            }
            return old;
          }
        );
      }
    } catch (error) {
      console.error('Error fetching new customer data:', error);
    }

    // Update dashboard counts
    this.updateDashboardCounts('customers', 'increment');
  }

  private handleCustomerUpdate(payload: RealtimePostgresChangesPayload<Record<string, any>>) {
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
  // CUSTOMER DEVICES SUBSCRIPTIONS
  // ============================================

  private handleCustomerDeviceInsert(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📱 New device added for customer:', payload.new.customer_id);
    
    const customerId = payload.new.customer_id;
    
    // Update customer devices list
    this.queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
      // Check if device already exists
      if (old.find((d: any) => d.id === payload.new.id)) return old;
      return [...old, payload.new];
    });

    // Update customer's device count in lists if needed
    this.queryClient.setQueriesData(
      { queryKey: ['customers'], exact: false },
      (old: any) => {
        if (Array.isArray(old)) {
          return old.map((customer: any) => 
            customer.id === customerId 
              ? { ...customer, device_count: (customer.device_count || 0) + 1 }
              : customer
          );
        } else if (old?.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((customer: any) => 
              customer.id === customerId 
                ? { ...customer, device_count: (customer.device_count || 0) + 1 }
                : customer
            )
          };
        }
        return old;
      }
    );
  }

  private handleCustomerDeviceUpdate(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📱 Device updated:', payload.new.id);
    
    const customerId = payload.new.customer_id;
    
    // Update device in the list
    this.queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
      return old.map(device => 
        device.id === payload.new.id ? { ...device, ...payload.new } : device
      );
    });
  }

  private handleCustomerDeviceDelete(payload: RealtimePostgresChangesPayload<any>) {
    console.log('📱 Device deleted:', payload.old.id);
    
    const customerId = payload.old.customer_id;
    
    // Remove device from the list
    this.queryClient.setQueryData(['customer-devices', customerId], (old: any[] = []) => {
      return old.filter(device => device.id !== payload.old.id);
    });

    // Update customer's device count in lists if needed
    this.queryClient.setQueriesData(
      { queryKey: ['customers'], exact: false },
      (old: any) => {
        if (Array.isArray(old)) {
          return old.map((customer: any) => 
            customer.id === customerId 
              ? { ...customer, device_count: Math.max(0, (customer.device_count || 1) - 1) }
              : customer
          );
        } else if (old?.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((customer: any) => 
              customer.id === customerId 
                ? { ...customer, device_count: Math.max(0, (customer.device_count || 1) - 1) }
                : customer
            )
          };
        }
        return old;
      }
    );
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

  private handleAppointmentUpdate(payload: RealtimePostgresChangesPayload<Record<string, any>>) {
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
    // Clear all debounce timeouts
    this.updateDebounce.forEach(timeout => clearTimeout(timeout));
    this.updateDebounce.clear();
    
    // Clear fetch cache
    this.fetchCache.clear();
    
    // Unsubscribe from all channels
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
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      fetchCacheSize: this.fetchCache.size,
      debounceQueueSize: this.updateDebounce.size,
      activeChannels: this.channels.size,
      isConnected: this.isConnected
    };
  }
  
  /**
   * Clear stale cache entries
   */
  clearStaleCache() {
    this.fetchCache.clear();
    console.log('🧹 Cleared fetch cache');
  }
}