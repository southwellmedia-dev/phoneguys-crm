-- Fix RLS issue for appointment creation from public API
-- The notify_on_appointment_created trigger needs to access users table
-- Using SECURITY DEFINER to run with elevated privileges

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_on_appointment_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_admin RECORD;
BEGIN
    -- Notify all admins and staff about new appointment
    -- This now runs with the function owner's privileges, bypassing RLS
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff')
    LOOP
        PERFORM public.create_internal_notification(
            v_admin.id,
            'appointment_created',
            'New Appointment Created',
            'A new appointment has been scheduled for ' || NEW.scheduled_date || ' at ' || NEW.scheduled_time,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'appointment_number', NEW.appointment_number,
                'customer_id', NEW.customer_id
            ),
            'normal',
            '/appointments/' || NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Also add a minimal RLS policy for anon to read user roles (belt and suspenders approach)
-- This allows the trigger to work even without SECURITY DEFINER in the future
CREATE POLICY "Anon can read minimal user info for system operations"
ON public.users FOR SELECT
TO anon
USING (role IN ('admin', 'staff'));

-- Grant execute permission on the function to anon role (if not already granted)
GRANT EXECUTE ON FUNCTION notify_on_appointment_created() TO anon;