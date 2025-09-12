-- Fix the appointment slot trigger to handle cases where slots don't exist
-- and to properly manage capacity

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_slot_on_appointment ON public.appointments;

-- Update the function to handle missing slots gracefully
CREATE OR REPLACE FUNCTION public.update_slot_on_appointment_change()
RETURNS TRIGGER AS $$
DECLARE
    v_slot_exists BOOLEAN;
    v_current_capacity INTEGER;
    v_max_capacity INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Check if a slot exists for this date/time
        SELECT EXISTS(
            SELECT 1 FROM public.appointment_slots
            WHERE date = NEW.scheduled_date
            AND start_time = NEW.scheduled_time
        ) INTO v_slot_exists;
        
        IF v_slot_exists THEN
            -- Get current and max capacity
            SELECT current_capacity, max_capacity 
            INTO v_current_capacity, v_max_capacity
            FROM public.appointment_slots
            WHERE date = NEW.scheduled_date
            AND start_time = NEW.scheduled_time;
            
            -- Only update if we won't exceed max capacity
            IF v_current_capacity < v_max_capacity THEN
                UPDATE public.appointment_slots
                SET 
                    is_available = CASE 
                        WHEN current_capacity + 1 >= max_capacity THEN false 
                        ELSE is_available 
                    END,
                    appointment_id = CASE 
                        WHEN max_capacity = 1 THEN NEW.id 
                        ELSE appointment_id 
                    END,
                    current_capacity = current_capacity + 1
                WHERE date = NEW.scheduled_date
                AND start_time = NEW.scheduled_time;
            END IF;
        END IF;
        
        -- Update staff availability count if assigned
        IF NEW.assigned_to IS NOT NULL THEN
            UPDATE public.staff_availability
            SET current_appointments = current_appointments + 1
            WHERE user_id = NEW.assigned_to
            AND date = NEW.scheduled_date;
        END IF;
        
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN
        -- Mark slot as available again if it exists
        UPDATE public.appointment_slots
        SET 
            is_available = true,
            appointment_id = CASE 
                WHEN appointment_id = COALESCE(OLD.id, NEW.id) THEN NULL 
                ELSE appointment_id 
            END,
            current_capacity = GREATEST(0, current_capacity - 1)
        WHERE date = COALESCE(OLD.scheduled_date, NEW.scheduled_date)
        AND start_time = COALESCE(OLD.scheduled_time, NEW.scheduled_time)
        AND current_capacity > 0;
        
        -- Update staff availability count
        IF COALESCE(OLD.assigned_to, NEW.assigned_to) IS NOT NULL THEN
            UPDATE public.staff_availability
            SET current_appointments = GREATEST(0, current_appointments - 1)
            WHERE user_id = COALESCE(OLD.assigned_to, NEW.assigned_to)
            AND date = COALESCE(OLD.scheduled_date, NEW.scheduled_date);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_slot_on_appointment
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_slot_on_appointment_change();

-- Add a comment explaining the fix
COMMENT ON FUNCTION public.update_slot_on_appointment_change() IS 
'Updates appointment slots when appointments are created/cancelled. 
Fixed to handle cases where slots don''t exist and to respect capacity constraints.';