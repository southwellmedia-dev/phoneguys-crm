-- Script to sync local database with production data
-- This clears local data and replaces it with production

-- Disable triggers to avoid foreign key issues
SET session_replication_role = replica;

-- Clear existing data in reverse dependency order
TRUNCATE TABLE 
  public.user_activity_logs,
  public.user_statistics,
  public.time_entries,
  public.ticket_services,
  public.ticket_photos,
  public.ticket_notes,
  public.notifications,
  public.repair_tickets,
  public.appointments,
  public.appointment_slots,
  public.customer_devices,
  public.customers,
  public.services,
  public.device_services,
  public.devices,
  public.device_models,
  public.manufacturers,
  public.user_id_mapping,
  public.users,
  public.business_hours,
  auth.sessions,
  auth.refresh_tokens,
  auth.mfa_amr_claims,
  auth.mfa_challenges,
  auth.mfa_factors,
  auth.identities,
  auth.users
CASCADE;

-- Re-enable triggers
SET session_replication_role = origin;