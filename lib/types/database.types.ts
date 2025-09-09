export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_number: string
          arrived_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          check_in_notes: string | null
          checked_in_by: string | null
          confirmation_notes: string | null
          confirmation_sent_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          converted_by: string | null
          converted_to_ticket_id: string | null
          created_at: string
          created_by: string | null
          customer_device_id: string | null
          customer_id: string | null
          description: string | null
          device_id: string | null
          duration_minutes: number | null
          estimated_cost: number | null
          id: string
          issues: string[] | null
          notes: string | null
          reminder_sent_at: string | null
          scheduled_date: string
          scheduled_time: string
          service_ids: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          appointment_number: string
          arrived_at?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          check_in_notes?: string | null
          checked_in_by?: string | null
          confirmation_notes?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          converted_by?: string | null
          converted_to_ticket_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_device_id?: string | null
          customer_id?: string | null
          description?: string | null
          device_id?: string | null
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          issues?: string[] | null
          notes?: string | null
          reminder_sent_at?: string | null
          scheduled_date: string
          scheduled_time: string
          service_ids?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          appointment_number?: string
          arrived_at?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          check_in_notes?: string | null
          checked_in_by?: string | null
          confirmation_notes?: string | null
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          converted_by?: string | null
          converted_to_ticket_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_device_id?: string | null
          customer_id?: string | null
          description?: string | null
          device_id?: string | null
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          issues?: string[] | null
          notes?: string | null
          reminder_sent_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_ids?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_converted_to_ticket_id_fkey"
            columns: ["converted_to_ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_device_id_fkey"
            columns: ["customer_device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_devices: {
        Row: {
          color: string | null
          condition: string | null
          created_at: string
          customer_id: string
          device_id: string | null
          id: string
          imei: string | null
          is_active: boolean | null
          is_primary: boolean | null
          nickname: string | null
          notes: string | null
          previous_repairs: Json | null
          purchase_date: string | null
          serial_number: string | null
          storage_size: string | null
          updated_at: string
          warranty_expires: string | null
        }
        Insert: {
          color?: string | null
          condition?: string | null
          created_at?: string
          customer_id: string
          device_id?: string | null
          id?: string
          imei?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          nickname?: string | null
          notes?: string | null
          previous_repairs?: Json | null
          purchase_date?: string | null
          serial_number?: string | null
          storage_size?: string | null
          updated_at?: string
          warranty_expires?: string | null
        }
        Update: {
          color?: string | null
          condition?: string | null
          created_at?: string
          customer_id?: string
          device_id?: string | null
          id?: string
          imei?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          nickname?: string | null
          notes?: string | null
          previous_repairs?: Json | null
          purchase_date?: string | null
          serial_number?: string | null
          storage_size?: string | null
          updated_at?: string
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      device_models: {
        Row: {
          average_repair_time_hours: number | null
          common_issues: string[] | null
          created_at: string
          device_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          manufacturer_id: string
          model_name: string
          model_number: string | null
          release_year: number | null
          specifications: Json | null
          total_repairs_count: number | null
          typical_repair_cost: number | null
          updated_at: string
        }
        Insert: {
          average_repair_time_hours?: number | null
          common_issues?: string[] | null
          created_at?: string
          device_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer_id: string
          model_name: string
          model_number?: string | null
          release_year?: number | null
          specifications?: Json | null
          total_repairs_count?: number | null
          typical_repair_cost?: number | null
          updated_at?: string
        }
        Update: {
          average_repair_time_hours?: number | null
          common_issues?: string[] | null
          created_at?: string
          device_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer_id?: string
          model_name?: string
          model_number?: string | null
          release_year?: number | null
          specifications?: Json | null
          total_repairs_count?: number | null
          typical_repair_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_models_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      device_services: {
        Row: {
          created_at: string
          device_id: string
          is_available: boolean | null
          notes: string | null
          service_id: string
          typical_duration_minutes: number | null
          typical_price: number | null
        }
        Insert: {
          created_at?: string
          device_id: string
          is_available?: boolean | null
          notes?: string | null
          service_id: string
          typical_duration_minutes?: number | null
          typical_price?: number | null
        }
        Update: {
          created_at?: string
          device_id?: string
          is_available?: boolean | null
          notes?: string | null
          service_id?: string
          typical_duration_minutes?: number | null
          typical_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_services_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          average_repair_cost: number | null
          average_repair_time_hours: number | null
          color_options: string[] | null
          common_issues: string[] | null
          created_at: string
          description: string | null
          device_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          manufacturer_id: string | null
          model_name: string
          model_number: string | null
          parts_availability: string | null
          release_year: number | null
          screen_size: string | null
          specifications: Json | null
          storage_options: string[] | null
          thumbnail_url: string | null
          total_repairs_count: number | null
          updated_at: string
        }
        Insert: {
          average_repair_cost?: number | null
          average_repair_time_hours?: number | null
          color_options?: string[] | null
          common_issues?: string[] | null
          created_at?: string
          description?: string | null
          device_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer_id?: string | null
          model_name: string
          model_number?: string | null
          parts_availability?: string | null
          release_year?: number | null
          screen_size?: string | null
          specifications?: Json | null
          storage_options?: string[] | null
          thumbnail_url?: string | null
          total_repairs_count?: number | null
          updated_at?: string
        }
        Update: {
          average_repair_cost?: number | null
          average_repair_time_hours?: number | null
          color_options?: string[] | null
          common_issues?: string[] | null
          created_at?: string
          description?: string | null
          device_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer_id?: string | null
          model_name?: string
          model_number?: string | null
          parts_availability?: string | null
          release_year?: number | null
          screen_size?: string | null
          specifications?: Json | null
          storage_options?: string[] | null
          thumbnail_url?: string | null
          total_repairs_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          total_repairs_count: number | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          total_repairs_count?: number | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          total_repairs_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          notification_type: string
          recipient_email: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_tickets: {
        Row: {
          actual_cost: number | null
          appointment_id: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_device_id: string | null
          customer_id: string
          date_received: string | null
          deposit_amount: number | null
          description: string | null
          device_brand: string
          device_id: string | null
          device_model: string
          device_model_id: string | null
          estimated_completion: string | null
          estimated_cost: number | null
          id: string
          imei: string | null
          is_timer_running: boolean | null
          priority: string
          repair_issues: string[]
          serial_number: string | null
          status: string
          ticket_number: string
          timer_started_at: string | null
          total_time_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_device_id?: string | null
          customer_id: string
          date_received?: string | null
          deposit_amount?: number | null
          description?: string | null
          device_brand: string
          device_id?: string | null
          device_model: string
          device_model_id?: string | null
          estimated_completion?: string | null
          estimated_cost?: number | null
          id?: string
          imei?: string | null
          is_timer_running?: boolean | null
          priority?: string
          repair_issues?: string[]
          serial_number?: string | null
          status?: string
          ticket_number: string
          timer_started_at?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_device_id?: string | null
          customer_id?: string
          date_received?: string | null
          deposit_amount?: number | null
          description?: string | null
          device_brand?: string
          device_id?: string | null
          device_model?: string
          device_model_id?: string | null
          estimated_completion?: string | null
          estimated_cost?: number | null
          id?: string
          imei?: string | null
          is_timer_running?: boolean | null
          priority?: string
          repair_issues?: string[]
          serial_number?: string | null
          status?: string
          ticket_number?: string
          timer_started_at?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_tickets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_customer_device_id_fkey"
            columns: ["customer_device_id"]
            isOneToOne: false
            referencedRelation: "customer_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_tickets_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category: string | null
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          requires_parts: boolean | null
          skill_level: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_parts?: boolean | null
          skill_level?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_parts?: boolean | null
          skill_level?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_important: boolean | null
          note_type: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          note_type?: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          note_type?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_photo_shares: {
        Row: {
          accessed_count: number | null
          created_at: string | null
          expires_at: string
          id: string
          last_accessed_at: string | null
          ticket_id: string
          token: string
        }
        Insert: {
          accessed_count?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          ticket_id: string
          token: string
        }
        Update: {
          accessed_count?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          ticket_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_photo_shares_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_photos: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_after_photo: boolean | null
          is_before_photo: boolean | null
          mime_type: string
          service_id: string | null
          tags: string[] | null
          ticket_id: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_after_photo?: boolean | null
          is_before_photo?: boolean | null
          mime_type: string
          service_id?: string | null
          tags?: string[] | null
          ticket_id: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_after_photo?: boolean | null
          is_before_photo?: boolean | null
          mime_type?: string
          service_id?: string | null
          tags?: string[] | null
          ticket_id?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_photos_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_services: {
        Row: {
          created_at: string
          id: string
          performed_at: string | null
          performed_by: string | null
          quantity: number | null
          service_id: string
          technician_notes: string | null
          ticket_id: string
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          quantity?: number | null
          service_id: string
          technician_notes?: string | null
          ticket_id: string
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          quantity?: number | null
          service_id?: string
          technician_notes?: string | null
          ticket_id?: string
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_services_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_services_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          start_time: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "repair_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_id_mapping: {
        Row: {
          app_user_id: string
          auth_user_id: string
          created_at: string | null
        }
        Insert: {
          app_user_id: string
          auth_user_id: string
          created_at?: string | null
        }
        Update: {
          app_user_id?: string
          auth_user_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          appointments_assigned: number | null
          appointments_cancelled: number | null
          appointments_converted: number | null
          appointments_created: number | null
          appointments_no_show: number | null
          avg_completion_time_hours: number | null
          conversion_rate: number | null
          created_at: string | null
          customer_satisfaction_avg: number | null
          daily_completion_avg: number | null
          id: string
          last_activity_at: string | null
          monthly_completion_avg: number | null
          notes_created: number | null
          stats_updated_at: string | null
          tickets_assigned: number | null
          tickets_cancelled: number | null
          tickets_completed: number | null
          tickets_created: number | null
          tickets_in_progress: number | null
          tickets_on_hold: number | null
          total_time_logged_minutes: number | null
          updated_at: string | null
          user_id: string
          weekly_completion_avg: number | null
        }
        Insert: {
          appointments_assigned?: number | null
          appointments_cancelled?: number | null
          appointments_converted?: number | null
          appointments_created?: number | null
          appointments_no_show?: number | null
          avg_completion_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_avg?: number | null
          daily_completion_avg?: number | null
          id?: string
          last_activity_at?: string | null
          monthly_completion_avg?: number | null
          notes_created?: number | null
          stats_updated_at?: string | null
          tickets_assigned?: number | null
          tickets_cancelled?: number | null
          tickets_completed?: number | null
          tickets_created?: number | null
          tickets_in_progress?: number | null
          tickets_on_hold?: number | null
          total_time_logged_minutes?: number | null
          updated_at?: string | null
          user_id: string
          weekly_completion_avg?: number | null
        }
        Update: {
          appointments_assigned?: number | null
          appointments_cancelled?: number | null
          appointments_converted?: number | null
          appointments_created?: number | null
          appointments_no_show?: number | null
          avg_completion_time_hours?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          customer_satisfaction_avg?: number | null
          daily_completion_avg?: number | null
          id?: string
          last_activity_at?: string | null
          monthly_completion_avg?: number | null
          notes_created?: number | null
          stats_updated_at?: string | null
          tickets_assigned?: number | null
          tickets_cancelled?: number | null
          tickets_completed?: number | null
          tickets_created?: number | null
          tickets_in_progress?: number | null
          tickets_on_hold?: number | null
          total_time_logged_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_completion_avg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          preferences: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          last_login_at?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          preferences?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_appointment_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_dashboard_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      log_user_activity: {
        Args: {
          p_activity_type: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      migrate_existing_repairs_to_devices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_statistics: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "arrived"
        | "no_show"
        | "cancelled"
        | "converted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "confirmed",
        "arrived",
        "no_show",
        "cancelled",
        "converted",
      ],
    },
  },
} as const

