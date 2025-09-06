

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."appointment_status" AS ENUM (
    'scheduled',
    'confirmed',
    'arrived',
    'no_show',
    'cancelled',
    'converted'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_appointment_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  next_number integer;
  appointment_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_number FROM 4) AS integer)), 0) + 1
  INTO next_number
  FROM appointments
  WHERE appointment_number ~ '^APT[0-9]+$';
  
  appointment_num := 'APT' || LPAD(next_number::text, 4, '0');
  RETURN appointment_num;
END;
$_$;


ALTER FUNCTION "public"."generate_appointment_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_ticket_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  next_number integer;
  ticket_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS integer)), 0) + 1
  INTO next_number
  FROM repair_tickets
  WHERE ticket_number ~ '^TPG[0-9]+$';
  
  ticket_num := 'TPG' || LPAD(next_number::text, 4, '0');
  RETURN ticket_num;
END;
$_$;


ALTER FUNCTION "public"."generate_ticket_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user already exists with this email
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- Update existing user to use the auth user's ID
    -- Note: This only works if there are no foreign key constraints
    -- Otherwise, just skip and let the app handle it
    RETURN NEW;
  ELSE
    -- Insert new user
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_existing_repairs_to_devices"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    repair_record RECORD;
    temp_manufacturer_id UUID;
    temp_model_id UUID;
BEGIN
    -- Loop through distinct device_brand and device_model combinations
    FOR repair_record IN 
        SELECT DISTINCT device_brand, device_model 
        FROM public.repair_tickets 
        WHERE device_brand IS NOT NULL AND device_model IS NOT NULL
        ORDER BY device_brand, device_model
    LOOP
        -- Insert or get manufacturer
        INSERT INTO public.manufacturers (name)
        VALUES (repair_record.device_brand)
        ON CONFLICT (name) DO NOTHING;
        
        SELECT id INTO temp_manufacturer_id 
        FROM public.manufacturers 
        WHERE name = repair_record.device_brand;
        
        -- Insert or get device model
        INSERT INTO public.device_models (manufacturer_id, model_name, device_type)
        VALUES (temp_manufacturer_id, repair_record.device_model, 'smartphone')
        ON CONFLICT (manufacturer_id, model_name, model_number) DO NOTHING;
        
        SELECT id INTO temp_model_id
        FROM public.device_models dm
        WHERE dm.manufacturer_id = temp_manufacturer_id 
        AND dm.model_name = repair_record.device_model;
        
        -- Update repair tickets with device_model_id
        UPDATE public.repair_tickets
        SET device_model_id = temp_model_id
        WHERE device_brand = repair_record.device_brand 
        AND device_model = repair_record.device_model
        AND device_model_id IS NULL;
    END LOOP;
    
    -- Update repair counts
    UPDATE public.device_models dm
    SET total_repairs_count = (
        SELECT COUNT(*) 
        FROM public.repair_tickets rt 
        WHERE rt.device_model_id = dm.id
    );
    
    UPDATE public.manufacturers m
    SET total_repairs_count = (
        SELECT COUNT(*) 
        FROM public.repair_tickets rt 
        JOIN public.device_models dm ON rt.device_model_id = dm.id
        WHERE dm.manufacturer_id = m.id
    );
END;
$$;


ALTER FUNCTION "public"."migrate_existing_repairs_to_devices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_appointment_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
    NEW.appointment_number := generate_appointment_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_appointment_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_ticket_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_ticket_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_devices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_devices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_models_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_device_models_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_repair_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.device_id IS NOT NULL THEN
            UPDATE public.devices 
            SET total_repairs_count = total_repairs_count + 1
            WHERE id = NEW.device_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.device_id IS NOT NULL THEN
            UPDATE public.devices 
            SET total_repairs_count = total_repairs_count - 1
            WHERE id = OLD.device_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.device_id IS DISTINCT FROM NEW.device_id THEN
            IF OLD.device_id IS NOT NULL THEN
                UPDATE public.devices 
                SET total_repairs_count = total_repairs_count - 1
                WHERE id = OLD.device_id;
            END IF;
            IF NEW.device_id IS NOT NULL THEN
                UPDATE public.devices 
                SET total_repairs_count = total_repairs_count + 1
                WHERE id = NEW.device_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_device_repair_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_device_repair_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.device_model_id IS NOT NULL THEN
        -- Update device model count
        UPDATE public.device_models 
        SET total_repairs_count = total_repairs_count + 1
        WHERE id = NEW.device_model_id;
        
        -- Update manufacturer count
        UPDATE public.manufacturers 
        SET total_repairs_count = total_repairs_count + 1
        WHERE id = (SELECT manufacturer_id FROM public.device_models WHERE id = NEW.device_model_id);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_device_repair_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_devices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_devices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_manufacturers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_manufacturers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_services_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_services_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_number" character varying(20) NOT NULL,
    "customer_id" "uuid",
    "device_id" "uuid",
    "customer_device_id" "uuid",
    "scheduled_date" "date" NOT NULL,
    "scheduled_time" time without time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "service_ids" "uuid"[],
    "estimated_cost" numeric(10,2),
    "status" "public"."appointment_status" DEFAULT 'scheduled'::"public"."appointment_status",
    "confirmation_sent_at" timestamp with time zone,
    "reminder_sent_at" timestamp with time zone,
    "arrived_at" timestamp with time zone,
    "converted_to_ticket_id" "uuid",
    "issues" "text"[],
    "description" "text",
    "urgency" character varying(50),
    "source" character varying(50),
    "notes" "text",
    "cancellation_reason" "text",
    "created_by" "uuid",
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "appointments_source_check" CHECK ((("source")::"text" = ANY ((ARRAY['website'::character varying, 'phone'::character varying, 'walk-in'::character varying, 'email'::character varying])::"text"[]))),
    CONSTRAINT "appointments_urgency_check" CHECK ((("urgency")::"text" = ANY ((ARRAY['walk-in'::character varying, 'scheduled'::character varying, 'emergency'::character varying])::"text"[])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


COMMENT ON TABLE "public"."appointments" IS 'Customer appointments and bookings for repairs';



CREATE TABLE IF NOT EXISTS "public"."customer_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "device_id" "uuid",
    "serial_number" character varying(200),
    "imei" character varying(200),
    "color" character varying(100),
    "storage_size" character varying(50),
    "nickname" character varying(100),
    "purchase_date" "date",
    "warranty_expires" "date",
    "condition" character varying(50),
    "previous_repairs" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "is_primary" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "customer_devices_condition_check" CHECK ((("condition")::"text" = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying, 'broken'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_devices" OWNER TO "postgres";


COMMENT ON TABLE "public"."customer_devices" IS 'Customer-owned devices with serial numbers and history';



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "address" "text",
    "city" character varying(100),
    "state" character varying(50),
    "zip_code" character varying(20),
    "notes" "text",
    "total_orders" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manufacturer_id" "uuid" NOT NULL,
    "model_name" character varying(200) NOT NULL,
    "model_number" character varying(100),
    "release_year" integer,
    "device_type" character varying(50),
    "is_active" boolean DEFAULT true,
    "total_repairs_count" integer DEFAULT 0,
    "common_issues" "text"[],
    "average_repair_time_hours" numeric(5,2),
    "typical_repair_cost" numeric(10,2),
    "image_url" "text",
    "specifications" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "device_models_device_type_check" CHECK ((("device_type")::"text" = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."device_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_services" (
    "device_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "typical_price" numeric(10,2),
    "typical_duration_minutes" integer,
    "notes" "text",
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."device_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_services" IS 'Service compatibility and pricing per device type';



CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manufacturer_id" "uuid",
    "model_name" character varying(200) NOT NULL,
    "model_number" character varying(100),
    "device_type" character varying(50),
    "release_year" integer,
    "thumbnail_url" "text",
    "image_url" "text",
    "description" "text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "screen_size" character varying(50),
    "storage_options" "text"[] DEFAULT '{}'::"text"[],
    "color_options" "text"[] DEFAULT '{}'::"text"[],
    "common_issues" "text"[] DEFAULT '{}'::"text"[],
    "average_repair_cost" numeric(10,2),
    "average_repair_time_hours" numeric(5,2),
    "parts_availability" character varying(50),
    "is_active" boolean DEFAULT true,
    "total_repairs_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "devices_device_type_check" CHECK ((("device_type")::"text" = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'earbuds'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "devices_parts_availability_check" CHECK ((("parts_availability")::"text" = ANY ((ARRAY['readily_available'::character varying, 'available'::character varying, 'limited'::character varying, 'scarce'::character varying, 'discontinued'::character varying])::"text"[])))
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


COMMENT ON TABLE "public"."devices" IS 'Master device database for all supported devices';



CREATE TABLE IF NOT EXISTS "public"."manufacturers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "logo_url" "text",
    "country" character varying(100),
    "is_active" boolean DEFAULT true,
    "total_repairs_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."manufacturers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['status_change'::"text", 'completion'::"text", 'on_hold'::"text", 'new_ticket'::"text"]))),
    CONSTRAINT "notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."repair_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" "text" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "device_brand" "text" NOT NULL,
    "device_model" "text" NOT NULL,
    "serial_number" "text",
    "imei" "text",
    "repair_issues" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "description" "text",
    "estimated_cost" numeric(10,2),
    "actual_cost" numeric(10,2),
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "total_time_minutes" integer DEFAULT 0,
    "is_timer_running" boolean DEFAULT false,
    "timer_started_at" timestamp with time zone,
    "date_received" timestamp with time zone DEFAULT "now"(),
    "estimated_completion" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deposit_amount" numeric(10,2) DEFAULT 0.00,
    "device_model_id" "uuid",
    "customer_device_id" "uuid",
    "device_id" "uuid",
    "appointment_id" "uuid",
    CONSTRAINT "repair_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "repair_tickets_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'on_hold'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."repair_tickets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."repair_tickets"."deposit_amount" IS 'Deposit amount collected from customer for the repair';



COMMENT ON COLUMN "public"."repair_tickets"."customer_device_id" IS 'Reference to the customer device being repaired';



COMMENT ON COLUMN "public"."repair_tickets"."appointment_id" IS 'Reference to the appointment this ticket was created from';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "base_price" numeric(10,2),
    "estimated_duration_minutes" integer,
    "requires_parts" boolean DEFAULT false,
    "skill_level" character varying(50),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "services_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['screen_repair'::character varying, 'battery_replacement'::character varying, 'charging_port'::character varying, 'water_damage'::character varying, 'diagnostic'::character varying, 'software_issue'::character varying, 'camera_repair'::character varying, 'speaker_repair'::character varying, 'button_repair'::character varying, 'motherboard_repair'::character varying, 'data_recovery'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "services_skill_level_check" CHECK ((("skill_level")::"text" = ANY ((ARRAY['basic'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::"text"[])))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


COMMENT ON TABLE "public"."services" IS 'Service catalog with pricing and duration estimates';



CREATE TABLE IF NOT EXISTS "public"."ticket_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "note_type" "text" DEFAULT 'internal'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "is_important" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['internal'::"text", 'customer'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."ticket_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_photo_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accessed_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone
);


ALTER TABLE "public"."ticket_photo_shares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_photos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "mime_type" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "is_before_photo" boolean DEFAULT false,
    "is_after_photo" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "service_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(10,2),
    "total_price" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    "technician_notes" "text",
    "performed_by" "uuid",
    "performed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ticket_services_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."ticket_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."ticket_services" IS 'Services performed on repair tickets';



CREATE TABLE IF NOT EXISTS "public"."time_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "duration_minutes" integer,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."time_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_id_mapping" (
    "auth_user_id" "uuid" NOT NULL,
    "app_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_id_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'technician'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'technician'::"text", 'manager'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_appointment_number_key" UNIQUE ("appointment_number");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_devices"
    ADD CONSTRAINT "customer_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_models"
    ADD CONSTRAINT "device_models_manufacturer_id_model_name_model_number_key" UNIQUE ("manufacturer_id", "model_name", "model_number");



ALTER TABLE ONLY "public"."device_models"
    ADD CONSTRAINT "device_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_services"
    ADD CONSTRAINT "device_services_pkey" PRIMARY KEY ("device_id", "service_id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manufacturers"
    ADD CONSTRAINT "manufacturers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."manufacturers"
    ADD CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_photo_shares"
    ADD CONSTRAINT "ticket_photo_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_photo_shares"
    ADD CONSTRAINT "ticket_photo_shares_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."ticket_photos"
    ADD CONSTRAINT "ticket_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_services"
    ADD CONSTRAINT "ticket_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_devices"
    ADD CONSTRAINT "unique_customer_imei" UNIQUE ("customer_id", "imei");



ALTER TABLE ONLY "public"."customer_devices"
    ADD CONSTRAINT "unique_customer_serial" UNIQUE ("customer_id", "serial_number");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "unique_device_model" UNIQUE ("manufacturer_id", "model_name", "model_number");



ALTER TABLE ONLY "public"."ticket_services"
    ADD CONSTRAINT "unique_ticket_service" UNIQUE ("ticket_id", "service_id");



ALTER TABLE ONLY "public"."user_id_mapping"
    ADD CONSTRAINT "user_id_mapping_pkey" PRIMARY KEY ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_assigned_to" ON "public"."appointments" USING "btree" ("assigned_to");



CREATE INDEX "idx_appointments_converted_ticket" ON "public"."appointments" USING "btree" ("converted_to_ticket_id");



CREATE INDEX "idx_appointments_customer" ON "public"."appointments" USING "btree" ("customer_id");



CREATE INDEX "idx_appointments_scheduled_date" ON "public"."appointments" USING "btree" ("scheduled_date");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_customer_devices_active" ON "public"."customer_devices" USING "btree" ("is_active");



CREATE INDEX "idx_customer_devices_customer" ON "public"."customer_devices" USING "btree" ("customer_id");



CREATE INDEX "idx_customer_devices_device" ON "public"."customer_devices" USING "btree" ("device_id");



CREATE INDEX "idx_customers_active" ON "public"."customers" USING "btree" ("is_active");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_zip" ON "public"."customers" USING "btree" ("zip_code");



CREATE INDEX "idx_device_models_active" ON "public"."device_models" USING "btree" ("is_active");



CREATE INDEX "idx_device_models_manufacturer" ON "public"."device_models" USING "btree" ("manufacturer_id");



CREATE INDEX "idx_device_models_name" ON "public"."device_models" USING "btree" ("model_name");



CREATE INDEX "idx_device_services_device" ON "public"."device_services" USING "btree" ("device_id");



CREATE INDEX "idx_device_services_service" ON "public"."device_services" USING "btree" ("service_id");



CREATE INDEX "idx_devices_active" ON "public"."devices" USING "btree" ("is_active");



CREATE INDEX "idx_devices_device_type" ON "public"."devices" USING "btree" ("device_type");



CREATE INDEX "idx_devices_manufacturer" ON "public"."devices" USING "btree" ("manufacturer_id");



CREATE INDEX "idx_devices_model_name" ON "public"."devices" USING "btree" ("model_name");



CREATE INDEX "idx_devices_search" ON "public"."devices" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((("model_name")::"text" || ' '::"text") || (COALESCE("model_number", ''::character varying))::"text")));



CREATE INDEX "idx_manufacturers_active" ON "public"."manufacturers" USING "btree" ("is_active");



CREATE INDEX "idx_manufacturers_name" ON "public"."manufacturers" USING "btree" ("name");



CREATE INDEX "idx_repair_tickets_appointment" ON "public"."repair_tickets" USING "btree" ("appointment_id");



CREATE INDEX "idx_repair_tickets_assigned_to" ON "public"."repair_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_repair_tickets_created_at" ON "public"."repair_tickets" USING "btree" ("created_at");



CREATE INDEX "idx_repair_tickets_customer_device_id" ON "public"."repair_tickets" USING "btree" ("customer_device_id");



CREATE INDEX "idx_repair_tickets_customer_id" ON "public"."repair_tickets" USING "btree" ("customer_id");



CREATE INDEX "idx_repair_tickets_deposit" ON "public"."repair_tickets" USING "btree" ("deposit_amount");



CREATE INDEX "idx_repair_tickets_device_model" ON "public"."repair_tickets" USING "btree" ("device_model_id");



CREATE INDEX "idx_repair_tickets_status" ON "public"."repair_tickets" USING "btree" ("status");



CREATE INDEX "idx_repair_tickets_ticket_number" ON "public"."repair_tickets" USING "btree" ("ticket_number");



CREATE INDEX "idx_services_active" ON "public"."services" USING "btree" ("is_active");



CREATE INDEX "idx_services_category" ON "public"."services" USING "btree" ("category");



CREATE INDEX "idx_services_name" ON "public"."services" USING "btree" ("name");



CREATE INDEX "idx_ticket_notes_ticket_id" ON "public"."ticket_notes" USING "btree" ("ticket_id");



CREATE INDEX "idx_ticket_photo_shares_expires_at" ON "public"."ticket_photo_shares" USING "btree" ("expires_at");



CREATE INDEX "idx_ticket_photo_shares_token" ON "public"."ticket_photo_shares" USING "btree" ("token");



CREATE INDEX "idx_ticket_photos_service_id" ON "public"."ticket_photos" USING "btree" ("service_id");



CREATE INDEX "idx_ticket_photos_tags" ON "public"."ticket_photos" USING "gin" ("tags");



CREATE INDEX "idx_ticket_photos_ticket_id" ON "public"."ticket_photos" USING "btree" ("ticket_id");



CREATE INDEX "idx_ticket_photos_uploaded_at" ON "public"."ticket_photos" USING "btree" ("uploaded_at");



CREATE INDEX "idx_ticket_services_service" ON "public"."ticket_services" USING "btree" ("service_id");



CREATE INDEX "idx_ticket_services_ticket" ON "public"."ticket_services" USING "btree" ("ticket_id");



CREATE INDEX "idx_time_entries_ticket_id" ON "public"."time_entries" USING "btree" ("ticket_id");



CREATE INDEX "idx_user_id_mapping_app_user_id" ON "public"."user_id_mapping" USING "btree" ("app_user_id");



CREATE OR REPLACE TRIGGER "increment_repair_counts" AFTER INSERT ON "public"."repair_tickets" FOR EACH ROW WHEN (("new"."device_model_id" IS NOT NULL)) EXECUTE FUNCTION "public"."update_device_repair_counts"();



CREATE OR REPLACE TRIGGER "set_appointment_number_trigger" BEFORE INSERT ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."set_appointment_number"();



CREATE OR REPLACE TRIGGER "trigger_set_ticket_number" BEFORE INSERT ON "public"."repair_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_ticket_number"();



CREATE OR REPLACE TRIGGER "trigger_update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_repair_tickets_updated_at" BEFORE UPDATE ON "public"."repair_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customer_devices_timestamp" BEFORE UPDATE ON "public"."customer_devices" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_devices_updated_at"();



CREATE OR REPLACE TRIGGER "update_device_models_timestamp" BEFORE UPDATE ON "public"."device_models" FOR EACH ROW EXECUTE FUNCTION "public"."update_device_models_updated_at"();



CREATE OR REPLACE TRIGGER "update_device_repairs_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."repair_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_device_repair_count"();



CREATE OR REPLACE TRIGGER "update_devices_timestamp" BEFORE UPDATE ON "public"."devices" FOR EACH ROW EXECUTE FUNCTION "public"."update_devices_updated_at"();



CREATE OR REPLACE TRIGGER "update_manufacturers_timestamp" BEFORE UPDATE ON "public"."manufacturers" FOR EACH ROW EXECUTE FUNCTION "public"."update_manufacturers_updated_at"();



CREATE OR REPLACE TRIGGER "update_services_timestamp" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_services_updated_at"();



CREATE OR REPLACE TRIGGER "update_ticket_photos_updated_at" BEFORE UPDATE ON "public"."ticket_photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_converted_to_ticket_id_fkey" FOREIGN KEY ("converted_to_ticket_id") REFERENCES "public"."repair_tickets"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_customer_device_id_fkey" FOREIGN KEY ("customer_device_id") REFERENCES "public"."customer_devices"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id");



ALTER TABLE ONLY "public"."customer_devices"
    ADD CONSTRAINT "customer_devices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_devices"
    ADD CONSTRAINT "customer_devices_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."device_models"
    ADD CONSTRAINT "device_models_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_services"
    ADD CONSTRAINT "device_services_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_services"
    ADD CONSTRAINT "device_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_customer_device_id_fkey" FOREIGN KEY ("customer_device_id") REFERENCES "public"."customer_devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "public"."device_models"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_photo_shares"
    ADD CONSTRAINT "ticket_photo_shares_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_photos"
    ADD CONSTRAINT "ticket_photos_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_photos"
    ADD CONSTRAINT "ticket_photos_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_photos"
    ADD CONSTRAINT "ticket_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_services"
    ADD CONSTRAINT "ticket_services_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."ticket_services"
    ADD CONSTRAINT "ticket_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."ticket_services"
    ADD CONSTRAINT "ticket_services_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Admins can manage users" ON "public"."users" TO "authenticated" USING (("auth"."email"() = 'admin@thephoneguys.com'::"text"));



CREATE POLICY "Allow all operations on device_models" ON "public"."device_models" USING (true);



CREATE POLICY "Allow all operations on manufacturers" ON "public"."manufacturers" USING (true);



CREATE POLICY "Authenticated users can create appointments" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create tickets" ON "public"."repair_tickets" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can delete appointments" ON "public"."appointments" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete customer_devices" ON "public"."customer_devices" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete customers" ON "public"."customers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete repair_tickets" ON "public"."repair_tickets" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage customers" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read all tickets" ON "public"."repair_tickets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update appointments" ON "public"."appointments" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update tickets" ON "public"."repair_tickets" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Service role can manage photo shares" ON "public"."ticket_photo_shares" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own profile" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can create ticket notes" ON "public"."ticket_notes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can delete photos they uploaded" ON "public"."ticket_photos" FOR DELETE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can manage notifications" ON "public"."notifications" TO "authenticated" USING (true);



CREATE POLICY "Users can manage their time entries" ON "public"."time_entries" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Users can read all notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read all ticket notes" ON "public"."ticket_notes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read all time entries" ON "public"."time_entries" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read basic user info" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read their own data" ON "public"."users" FOR SELECT TO "authenticated" USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can update their own notes or admins can update any" ON "public"."ticket_notes" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can upload photos for tickets they have access to" ON "public"."ticket_photos" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."repair_tickets" "rt"
  WHERE ("rt"."id" = "ticket_photos"."ticket_id"))));



CREATE POLICY "Users can view photos for tickets they have access to" ON "public"."ticket_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."repair_tickets" "rt"
  WHERE ("rt"."id" = "ticket_photos"."ticket_id"))));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_can_view_appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_customer_devices" ON "public"."customer_devices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_devices" ON "public"."devices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_services" ON "public"."services" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_can_view_ticket_photos" ON "public"."ticket_photos" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."customer_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manufacturers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repair_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_photo_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."appointments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customer_devices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."devices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."repair_tickets";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."services";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ticket_notes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ticket_photos";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ticket_services";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."time_entries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."generate_appointment_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_appointment_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_appointment_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_existing_repairs_to_devices"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_existing_repairs_to_devices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_existing_repairs_to_devices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_appointment_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_appointment_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_appointment_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_devices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_devices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_devices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_models_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_models_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_models_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_repair_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_repair_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_repair_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_device_repair_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_device_repair_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_device_repair_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_devices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_devices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_devices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_manufacturers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_manufacturers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_manufacturers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."customer_devices" TO "anon";
GRANT ALL ON TABLE "public"."customer_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_devices" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."device_models" TO "anon";
GRANT ALL ON TABLE "public"."device_models" TO "authenticated";
GRANT ALL ON TABLE "public"."device_models" TO "service_role";



GRANT ALL ON TABLE "public"."device_services" TO "anon";
GRANT ALL ON TABLE "public"."device_services" TO "authenticated";
GRANT ALL ON TABLE "public"."device_services" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."manufacturers" TO "anon";
GRANT ALL ON TABLE "public"."manufacturers" TO "authenticated";
GRANT ALL ON TABLE "public"."manufacturers" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."repair_tickets" TO "anon";
GRANT ALL ON TABLE "public"."repair_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."repair_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_notes" TO "anon";
GRANT ALL ON TABLE "public"."ticket_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_notes" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_photo_shares" TO "anon";
GRANT ALL ON TABLE "public"."ticket_photo_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_photo_shares" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_photos" TO "anon";
GRANT ALL ON TABLE "public"."ticket_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_photos" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_services" TO "anon";
GRANT ALL ON TABLE "public"."ticket_services" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_services" TO "service_role";



GRANT ALL ON TABLE "public"."time_entries" TO "anon";
GRANT ALL ON TABLE "public"."time_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."time_entries" TO "service_role";



GRANT ALL ON TABLE "public"."user_id_mapping" TO "anon";
GRANT ALL ON TABLE "public"."user_id_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."user_id_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
