-- Fix duplicate activity logging by preventing database triggers from creating duplicate activities
-- when converting appointments to tickets

-- Drop the existing triggers that cause duplicate activities
DROP TRIGGER IF EXISTS log_ticket_activity ON public.repair_tickets;
DROP TRIGGER IF EXISTS log_appointment_activity ON public.appointments;

-- Create improved ticket activity trigger that skips tickets created from appointments
CREATE OR REPLACE FUNCTION public.trigger_log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Skip activity logging if this ticket has an appointment_id 
        -- (meaning it was converted from an appointment)
        -- The conversion process handles activity logging explicitly
        IF NEW.appointment_id IS NOT NULL THEN
            RETURN NEW;
        END IF;
        
        -- For regular ticket creation (not from appointment), log the activity
        IF NEW.created_by IS NOT NULL THEN
            PERFORM log_user_activity(
                NEW.created_by,
                'ticket_created',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
        
        -- Skip automatic assignment logging for converted tickets
        -- The conversion handles this with more context
        IF NEW.assigned_to IS NOT NULL AND NEW.appointment_id IS NULL THEN
            PERFORM log_user_activity(
                NEW.assigned_to,
                'ticket_assigned',
                'repair_ticket',
                NEW.id,
                jsonb_build_object('ticket_number', NEW.ticket_number)
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Status change logging
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
        
        -- Assignment change logging (but not for initial assignment from appointment conversion)
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
            -- Skip if this is the first assignment and ticket has appointment_id
            IF OLD.assigned_to IS NULL AND NEW.appointment_id IS NOT NULL THEN
                RETURN NEW;
            END IF;
            
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
$$ LANGUAGE plpgsql;

-- Create improved appointment activity trigger that doesn't log conversion
-- (conversion is handled by the application with more context)
CREATE OR REPLACE FUNCTION public.trigger_log_appointment_activity()
RETURNS TRIGGER AS $$
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
        -- Skip automatic logging of appointment conversion
        -- The application handles this with proper context (ticket number, etc.)
        -- We'll only log status changes that aren't conversions
        IF OLD.status != NEW.status AND NEW.status != 'converted' THEN
            -- Log other status changes if needed
            IF NEW.created_by IS NOT NULL OR NEW.assigned_to IS NOT NULL THEN
                PERFORM log_user_activity(
                    COALESCE(NEW.assigned_to, NEW.created_by),
                    'appointment_status_changed',
                    'appointment',
                    NEW.id,
                    jsonb_build_object(
                        'appointment_number', NEW.appointment_number,
                        'old_status', OLD.status,
                        'new_status', NEW.status
                    )
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the triggers with the improved functions
CREATE TRIGGER log_ticket_activity
AFTER INSERT OR UPDATE ON public.repair_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_ticket_activity();

CREATE TRIGGER log_appointment_activity
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_appointment_activity();

-- Add comment explaining the strategy
COMMENT ON FUNCTION public.trigger_log_ticket_activity() IS 
'Logs ticket activities but skips tickets created from appointments to prevent duplicates. 
The appointment conversion process handles activity logging with proper context.';

COMMENT ON FUNCTION public.trigger_log_appointment_activity() IS 
'Logs appointment activities but skips conversion logging to prevent duplicates. 
The conversion process in the application handles this with full context.';