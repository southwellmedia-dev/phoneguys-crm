-- Add slot generation logic for appointment system
-- This migration creates functions to generate appointment slots based on business hours

-- First, ensure we have the appointment_settings column for slot duration if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointment_settings' 
        AND column_name = 'slot_duration_minutes'
    ) THEN
        ALTER TABLE public.appointment_settings 
        ADD COLUMN slot_duration_minutes INTEGER DEFAULT 30;
    END IF;
END $$;

-- Drop existing function if it exists (might have different signature)
DROP FUNCTION IF EXISTS public.generate_appointment_slots(DATE, INTEGER);

-- Function to generate appointment slots for a given date
CREATE OR REPLACE FUNCTION public.generate_appointment_slots(
    p_date DATE,
    p_slot_duration INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_day_of_week INTEGER;
    v_business_hours RECORD;
    v_special_date RECORD;
    v_current_time TIME;
    v_end_time TIME;
    v_slot_duration INTEGER;
    v_slots_created INTEGER := 0;
    v_break_start TIME;
    v_break_end TIME;
BEGIN
    -- Get the slot duration from settings if not provided
    IF p_slot_duration IS NULL THEN
        SELECT COALESCE(slot_duration_minutes, 30) INTO v_slot_duration
        FROM public.appointment_settings
        LIMIT 1;
        
        -- Default to 30 if no settings exist
        IF v_slot_duration IS NULL THEN
            v_slot_duration := 30;
        END IF;
    ELSE
        v_slot_duration := p_slot_duration;
    END IF;
    
    -- Get day of week (0=Sunday, 6=Saturday)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Check for special dates first (holidays, closures)
    SELECT * INTO v_special_date
    FROM public.special_dates
    WHERE date = p_date;
    
    -- If it's a closure day, don't generate slots
    IF v_special_date.type = 'closure' THEN
        RETURN 0;
    END IF;
    
    -- Get business hours (use special hours if available)
    IF v_special_date.type = 'special_hours' THEN
        v_current_time := v_special_date.open_time;
        v_end_time := v_special_date.close_time;
        v_break_start := NULL;
        v_break_end := NULL;
    ELSE
        SELECT * INTO v_business_hours
        FROM public.business_hours
        WHERE day_of_week = v_day_of_week AND is_active = true;
        
        IF v_business_hours IS NULL OR NOT v_business_hours.is_active THEN
            RETURN 0; -- No business hours for this day
        END IF;
        
        v_current_time := v_business_hours.open_time;
        v_end_time := v_business_hours.close_time;
        v_break_start := v_business_hours.break_start;
        v_break_end := v_business_hours.break_end;
    END IF;
    
    -- Delete existing slots for this date first
    DELETE FROM public.appointment_slots WHERE date = p_date;
    
    -- Generate slots for the day
    WHILE v_current_time < v_end_time LOOP
        -- Calculate slot end time
        DECLARE
            v_slot_end TIME;
        BEGIN
            v_slot_end := v_current_time + (v_slot_duration || ' minutes')::INTERVAL;
            
            -- Skip slots that overlap with break time
            IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
                -- Check if slot overlaps with break
                IF NOT (v_slot_end <= v_break_start OR v_current_time >= v_break_end) THEN
                    -- Skip this slot and move to after break
                    v_current_time := v_break_end;
                    CONTINUE;
                END IF;
            END IF;
            
            -- Don't create slots that extend past closing time
            IF v_slot_end > v_end_time THEN
                EXIT;
            END IF;
            
            -- Insert the slot
            INSERT INTO public.appointment_slots (
                date,
                start_time,
                end_time,
                duration_minutes,
                is_available,
                max_capacity,
                current_capacity,
                slot_type
            ) VALUES (
                p_date,
                v_current_time,
                v_slot_end,
                v_slot_duration,
                true,
                1,  -- Default capacity of 1 appointment per slot
                0,
                'regular'
            ) ON CONFLICT (date, start_time, staff_id) DO NOTHING;
            
            v_slots_created := v_slots_created + 1;
            v_current_time := v_slot_end;
        END;
    END LOOP;
    
    RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slots for a date range
CREATE OR REPLACE FUNCTION public.generate_appointment_slots_range(
    p_start_date DATE,
    p_end_date DATE,
    p_slot_duration INTEGER DEFAULT NULL
)
RETURNS TABLE(date DATE, slots_created INTEGER) AS $$
DECLARE
    v_current_date DATE;
    v_slots INTEGER;
BEGIN
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        v_slots := public.generate_appointment_slots(v_current_date, p_slot_duration);
        date := v_current_date;
        slots_created := v_slots;
        RETURN NEXT;
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots with formatted times
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_date DATE
)
RETURNS TABLE(
    slot_id UUID,
    start_time TIME,
    end_time TIME,
    formatted_time TEXT,
    is_available BOOLEAN,
    capacity_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as slot_id,
        s.start_time,
        s.end_time,
        TO_CHAR(s.start_time, 'HH12:MI AM') || ' - ' || TO_CHAR(s.end_time, 'HH12:MI AM') as formatted_time,
        s.is_available AND (s.current_capacity < s.max_capacity) as is_available,
        s.max_capacity - s.current_capacity as capacity_remaining
    FROM public.appointment_slots s
    WHERE s.date = p_date
    ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if slots exist for a date
CREATE OR REPLACE FUNCTION public.has_appointment_slots(p_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.appointment_slots WHERE date = p_date LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots TO anon;
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots TO service_role;

GRANT EXECUTE ON FUNCTION public.generate_appointment_slots_range TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots_range TO anon;
GRANT EXECUTE ON FUNCTION public.generate_appointment_slots_range TO service_role;

GRANT EXECUTE ON FUNCTION public.get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_slots TO anon;
GRANT EXECUTE ON FUNCTION public.get_available_slots TO service_role;

GRANT EXECUTE ON FUNCTION public.has_appointment_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_appointment_slots TO anon;
GRANT EXECUTE ON FUNCTION public.has_appointment_slots TO service_role;

-- Generate slots for the next 30 days automatically
DO $$
DECLARE
    v_result RECORD;
BEGIN
    -- Generate slots for the next 30 days
    FOR v_result IN 
        SELECT * FROM public.generate_appointment_slots_range(
            CURRENT_DATE,
            CURRENT_DATE + 30,  -- Add 30 days as integer
            30  -- 30 minute slots by default
        )
    LOOP
        RAISE NOTICE 'Generated % slots for %', v_result.slots_created, v_result.date;
    END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION public.generate_appointment_slots IS 'Generates appointment slots for a given date based on business hours and settings';
COMMENT ON FUNCTION public.generate_appointment_slots_range IS 'Generates appointment slots for a date range';
COMMENT ON FUNCTION public.get_available_slots IS 'Returns available appointment slots for a given date with formatted times';
COMMENT ON FUNCTION public.has_appointment_slots IS 'Checks if appointment slots exist for a given date';