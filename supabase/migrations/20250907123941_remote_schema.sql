drop extension if exists "pg_net";

alter table "public"."appointments" drop constraint "appointments_source_check";

alter table "public"."appointments" drop constraint "appointments_urgency_check";

alter table "public"."customer_devices" drop constraint "customer_devices_condition_check";

alter table "public"."device_models" drop constraint "device_models_device_type_check";

alter table "public"."devices" drop constraint "devices_device_type_check";

alter table "public"."devices" drop constraint "devices_parts_availability_check";

alter table "public"."services" drop constraint "services_category_check";

alter table "public"."services" drop constraint "services_skill_level_check";

alter table "public"."appointments" add constraint "appointments_source_check" CHECK (((source)::text = ANY ((ARRAY['website'::character varying, 'phone'::character varying, 'walk-in'::character varying, 'email'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_source_check";

alter table "public"."appointments" add constraint "appointments_urgency_check" CHECK (((urgency)::text = ANY ((ARRAY['walk-in'::character varying, 'scheduled'::character varying, 'emergency'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_urgency_check";

alter table "public"."customer_devices" add constraint "customer_devices_condition_check" CHECK (((condition)::text = ANY ((ARRAY['excellent'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying, 'broken'::character varying])::text[]))) not valid;

alter table "public"."customer_devices" validate constraint "customer_devices_condition_check";

alter table "public"."device_models" add constraint "device_models_device_type_check" CHECK (((device_type)::text = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."device_models" validate constraint "device_models_device_type_check";

alter table "public"."devices" add constraint "devices_device_type_check" CHECK (((device_type)::text = ANY ((ARRAY['smartphone'::character varying, 'tablet'::character varying, 'laptop'::character varying, 'smartwatch'::character varying, 'desktop'::character varying, 'earbuds'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."devices" validate constraint "devices_device_type_check";

alter table "public"."devices" add constraint "devices_parts_availability_check" CHECK (((parts_availability)::text = ANY ((ARRAY['readily_available'::character varying, 'available'::character varying, 'limited'::character varying, 'scarce'::character varying, 'discontinued'::character varying])::text[]))) not valid;

alter table "public"."devices" validate constraint "devices_parts_availability_check";

alter table "public"."services" add constraint "services_category_check" CHECK (((category)::text = ANY ((ARRAY['screen_repair'::character varying, 'battery_replacement'::character varying, 'charging_port'::character varying, 'water_damage'::character varying, 'diagnostic'::character varying, 'software_issue'::character varying, 'camera_repair'::character varying, 'speaker_repair'::character varying, 'button_repair'::character varying, 'motherboard_repair'::character varying, 'data_recovery'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_category_check";

alter table "public"."services" add constraint "services_skill_level_check" CHECK (((skill_level)::text = ANY ((ARRAY['basic'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_skill_level_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_role TEXT;
    v_result JSON;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;
    
    -- Build dashboard data based on role
    IF v_user_role = 'technician' THEN
        SELECT json_build_object(
            'role', v_user_role,
            'todaysTickets', (
                SELECT json_agg(row_to_json(t))
                FROM (
                    SELECT rt.*, c.name as customer_name
                    FROM public.repair_tickets rt
                    LEFT JOIN public.customers c ON rt.customer_id = c.id
                    WHERE rt.assigned_to = p_user_id
                    AND rt.status IN ('new', 'in_progress')
                    ORDER BY rt.priority DESC, rt.created_at ASC
                    LIMIT 10
                ) t
            ),
            'upcomingAppointments', (
                SELECT json_agg(row_to_json(a))
                FROM (
                    SELECT a.*, c.name as customer_name
                    FROM public.appointments a
                    LEFT JOIN public.customers c ON a.customer_id = c.id
                    WHERE a.assigned_to = p_user_id
                    AND a.status IN ('scheduled', 'confirmed')
                    AND a.scheduled_date >= CURRENT_DATE
                    ORDER BY a.scheduled_date, a.scheduled_time
                    LIMIT 5
                ) a
            ),
            'statistics', (
                SELECT row_to_json(s)
                FROM public.user_statistics s
                WHERE s.user_id = p_user_id
            ),
            'recentActivity', (
                SELECT json_agg(row_to_json(l))
                FROM (
                    SELECT *
                    FROM public.user_activity_logs
                    WHERE user_id = p_user_id
                    ORDER BY created_at DESC
                    LIMIT 10
                ) l
            )
        ) INTO v_result;
    ELSIF v_user_role = 'manager' THEN
        SELECT json_build_object(
            'role', v_user_role,
            'teamOverview', (
                SELECT json_agg(row_to_json(u))
                FROM (
                    SELECT 
                        u.id, 
                        u.full_name, 
                        u.role,
                        us.tickets_in_progress,
                        us.tickets_completed,
                        us.daily_completion_avg
                    FROM public.users u
                    LEFT JOIN public.user_statistics us ON u.id = us.user_id
                    WHERE u.role = 'technician'
                ) u
            ),
            'workloadDistribution', (
                SELECT json_build_object(
                    'unassigned', COUNT(*) FILTER (WHERE assigned_to IS NULL),
                    'assigned', COUNT(*) FILTER (WHERE assigned_to IS NOT NULL)
                )
                FROM public.repair_tickets
                WHERE status IN ('new', 'in_progress')
            ),
            'todaysMetrics', (
                SELECT json_build_object(
                    'ticketsCreated', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
                    'ticketsCompleted', COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE),
                    'appointmentsScheduled', (
                        SELECT COUNT(*) 
                        FROM public.appointments 
                        WHERE scheduled_date = CURRENT_DATE
                    )
                )
                FROM public.repair_tickets
            )
        ) INTO v_result;
    ELSE -- admin
        -- Return comprehensive data for admin
        SELECT json_build_object(
            'role', v_user_role,
            'systemStats', (
                SELECT json_build_object(
                    'totalUsers', (SELECT COUNT(*) FROM public.users),
                    'totalTickets', (SELECT COUNT(*) FROM public.repair_tickets),
                    'totalAppointments', (SELECT COUNT(*) FROM public.appointments),
                    'activeTickets', (SELECT COUNT(*) FROM public.repair_tickets WHERE status IN ('new', 'in_progress'))
                )
            ),
            'userActivity', (
                SELECT json_agg(row_to_json(a))
                FROM (
                    SELECT 
                        l.*,
                        u.full_name as user_name
                    FROM public.user_activity_logs l
                    JOIN public.users u ON l.user_id = u.id
                    ORDER BY l.created_at DESC
                    LIMIT 20
                ) a
            )
        ) INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_activity(p_user_id uuid, p_activity_type text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        details,
        created_at
    )
    VALUES (
        p_user_id,
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_details,
        NOW()
    );
    
    -- Update last_activity_at in user_statistics
    UPDATE public.user_statistics 
    SET last_activity_at = NOW() 
    WHERE user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_appointment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.created_by,
                'appointment_created',
                'appointment',
                NEW.id,
                jsonb_build_object('appointment_number', NEW.appointment_number)
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.status = 'converted' AND NEW.converted_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.converted_by,
                'appointment_converted',
                'appointment',
                NEW.id,
                jsonb_build_object(
                    'appointment_number', NEW.appointment_number,
                    'ticket_id', NEW.converted_to_ticket_id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_note_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
        PERFORM log_user_activity(
            NEW.user_id,
            'note_created',
            'ticket_note',
            NEW.id,
            jsonb_build_object(
                'ticket_id', NEW.ticket_id,
                'note_type', NEW.note_type
            )
        );
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_log_ticket_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.created_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.created_by,
                'ticket_created',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
        IF NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_assigned',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status AND NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_status_changed',
                'repair_ticket',
                NEW.id,
                jsonb_build_object(
                    'ticket_number', NEW.ticket_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_assigned',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;


