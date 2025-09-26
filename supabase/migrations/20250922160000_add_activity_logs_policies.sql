-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'appointment', 'ticket', 'customer', etc.
    entity_id UUID,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', etc.
    description TEXT,
    metadata JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all activities
CREATE POLICY "activity_logs_select_authenticated" ON activity_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for authenticated users to insert activities
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for service role to do everything
CREATE POLICY "activity_logs_all_service" ON activity_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- IMPORTANT: Policy for anon users to insert activities (for public API)
CREATE POLICY "activity_logs_insert_anon" ON activity_logs
    FOR INSERT
    TO anon
    WITH CHECK (
        -- Only allow specific entity types from public API
        entity_type IN ('appointment', 'form_submission', 'customer')
    );

-- Create or replace function to automatically log appointment activities
CREATE OR REPLACE FUNCTION log_appointment_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log for appointments created from internal sources (not website)
    -- Website appointments are logged separately in the API
    IF TG_OP = 'INSERT' AND (NEW.source IS NULL OR NEW.source != 'website') THEN
        INSERT INTO activity_logs (
            entity_type,
            entity_id,
            action,
            description,
            metadata,
            user_id,
            created_at
        ) VALUES (
            'appointment',
            NEW.id,
            'created',
            'Appointment #' || NEW.appointment_number || ' created',
            jsonb_build_object(
                'appointment_number', NEW.appointment_number,
                'customer_id', NEW.customer_id,
                'device_id', NEW.device_id,
                'scheduled_date', NEW.scheduled_date,
                'scheduled_time', NEW.scheduled_time,
                'source', COALESCE(NEW.source, 'internal'),
                'status', NEW.status
            ),
            NEW.created_by,
            NEW.created_at
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO activity_logs (
                entity_type,
                entity_id,
                action,
                description,
                metadata,
                user_id,
                created_at
            ) VALUES (
                'appointment',
                NEW.id,
                'status_changed',
                'Appointment #' || NEW.appointment_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
                jsonb_build_object(
                    'appointment_number', NEW.appointment_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'customer_id', NEW.customer_id
                ),
                auth.uid(),
                NOW()
            );
        END IF;
        
        -- Log conversion to ticket
        IF OLD.converted_to_ticket_id IS NULL AND NEW.converted_to_ticket_id IS NOT NULL THEN
            INSERT INTO activity_logs (
                entity_type,
                entity_id,
                action,
                description,
                metadata,
                user_id,
                created_at
            ) VALUES (
                'appointment',
                NEW.id,
                'converted_to_ticket',
                'Appointment #' || NEW.appointment_number || ' converted to ticket',
                jsonb_build_object(
                    'appointment_number', NEW.appointment_number,
                    'ticket_id', NEW.converted_to_ticket_id,
                    'customer_id', NEW.customer_id
                ),
                auth.uid(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointments (if doesn't exist)
DROP TRIGGER IF EXISTS appointment_activity_trigger ON appointments;
CREATE TRIGGER appointment_activity_trigger
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_activity();

-- Create or replace function to automatically log ticket activities
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (
            entity_type,
            entity_id,
            action,
            description,
            metadata,
            user_id,
            created_at
        ) VALUES (
            'ticket',
            NEW.id,
            'created',
            'Ticket #' || NEW.ticket_number || ' created',
            jsonb_build_object(
                'ticket_number', NEW.ticket_number,
                'customer_id', NEW.customer_id,
                'device_id', NEW.customer_device_id,
                'status', NEW.status,
                'priority', NEW.priority
            ),
            NEW.created_by,
            NEW.created_at
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO activity_logs (
                entity_type,
                entity_id,
                action,
                description,
                metadata,
                user_id,
                created_at
            ) VALUES (
                'ticket',
                NEW.id,
                'status_changed',
                'Ticket #' || NEW.ticket_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
                jsonb_build_object(
                    'ticket_number', NEW.ticket_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'customer_id', NEW.customer_id
                ),
                auth.uid(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tickets (if doesn't exist)
DROP TRIGGER IF EXISTS ticket_activity_trigger ON repair_tickets;
CREATE TRIGGER ticket_activity_trigger
    AFTER INSERT OR UPDATE ON repair_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_ticket_activity();

-- Add comment
COMMENT ON TABLE activity_logs IS 'Stores activity feed data for appointments, tickets, and other entities';