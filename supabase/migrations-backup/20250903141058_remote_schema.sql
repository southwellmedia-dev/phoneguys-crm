

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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


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
    CONSTRAINT "repair_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "repair_tickets_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'on_hold'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."repair_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "note_type" "text" DEFAULT 'internal'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "is_important" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['internal'::"text", 'customer_communication'::"text"])))
);


ALTER TABLE "public"."ticket_notes" OWNER TO "postgres";


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


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_repair_tickets_assigned_to" ON "public"."repair_tickets" USING "btree" ("assigned_to");



CREATE INDEX "idx_repair_tickets_created_at" ON "public"."repair_tickets" USING "btree" ("created_at");



CREATE INDEX "idx_repair_tickets_customer_id" ON "public"."repair_tickets" USING "btree" ("customer_id");



CREATE INDEX "idx_repair_tickets_status" ON "public"."repair_tickets" USING "btree" ("status");



CREATE INDEX "idx_repair_tickets_ticket_number" ON "public"."repair_tickets" USING "btree" ("ticket_number");



CREATE INDEX "idx_ticket_notes_ticket_id" ON "public"."ticket_notes" USING "btree" ("ticket_id");



CREATE INDEX "idx_time_entries_ticket_id" ON "public"."time_entries" USING "btree" ("ticket_id");



CREATE OR REPLACE TRIGGER "trigger_set_ticket_number" BEFORE INSERT ON "public"."repair_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_ticket_number"();



CREATE OR REPLACE TRIGGER "trigger_update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_repair_tickets_updated_at" BEFORE UPDATE ON "public"."repair_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."repair_tickets"
    ADD CONSTRAINT "repair_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_notes"
    ADD CONSTRAINT "ticket_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."repair_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_entries"
    ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Admins can manage users" ON "public"."users" TO "authenticated" USING (("auth"."email"() = 'admin@thephoneguys.com'::"text"));



CREATE POLICY "Authenticated users can create tickets" ON "public"."repair_tickets" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can manage customers" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can read all tickets" ON "public"."repair_tickets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update tickets" ON "public"."repair_tickets" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can create their own profile" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can create ticket notes" ON "public"."ticket_notes" FOR INSERT TO "authenticated" WITH CHECK (true);



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



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repair_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."repair_tickets" TO "anon";
GRANT ALL ON TABLE "public"."repair_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."repair_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_notes" TO "anon";
GRANT ALL ON TABLE "public"."ticket_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_notes" TO "service_role";



GRANT ALL ON TABLE "public"."time_entries" TO "anon";
GRANT ALL ON TABLE "public"."time_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."time_entries" TO "service_role";



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
