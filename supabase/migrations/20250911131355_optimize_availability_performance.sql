-- Optimize availability performance with better indexes and batch functions

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date_available 
ON appointment_slots(date, is_available) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_appointment_slots_date_time 
ON appointment_slots(date, start_time);

CREATE INDEX IF NOT EXISTS idx_special_dates_date 
ON special_dates(date);

CREATE INDEX IF NOT EXISTS idx_business_hours_active 
ON business_hours(day_of_week, is_active) 
WHERE is_active = true;

-- Function to generate appointment slots for a date range
CREATE OR REPLACE FUNCTION generate_slots_for_date_range(
  p_start_date DATE,
  p_end_date DATE,
  p_slot_duration INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
  curr_date DATE;
  day_of_week_num INTEGER;
  business_hours RECORD;
  special_date RECORD;
  slot_time TIME;
  end_time TIME;
  break_start TIME;
  break_end TIME;
BEGIN
  -- Loop through each date in the range
  curr_date := p_start_date;
  
  WHILE curr_date <= p_end_date LOOP
    day_of_week_num := EXTRACT(DOW FROM curr_date);
    
    -- Check if slots already exist for this date
    IF NOT EXISTS (
      SELECT 1 FROM appointment_slots 
      WHERE date = curr_date 
      LIMIT 1
    ) THEN
      -- Check for special dates first
      SELECT * INTO special_date 
      FROM special_dates 
      WHERE date = curr_date;
      
      -- Skip if it's a closure
      IF special_date.type = 'closure' THEN
        curr_date := curr_date + 1;
        CONTINUE;
      END IF;
      
      -- Get business hours or special hours
      IF special_date.type = 'special_hours' THEN
        slot_time := special_date.open_time::TIME;
        end_time := special_date.close_time::TIME;
        break_start := NULL;
        break_end := NULL;
      ELSE
        -- Get regular business hours
        SELECT * INTO business_hours
        FROM business_hours
        WHERE business_hours.day_of_week = day_of_week_num
        AND is_active = true;
        
        IF business_hours IS NULL THEN
          curr_date := curr_date + 1;
          CONTINUE;
        END IF;
        
        slot_time := business_hours.open_time::TIME;
        end_time := business_hours.close_time::TIME;
        break_start := business_hours.break_start::TIME;
        break_end := business_hours.break_end::TIME;
      END IF;
      
      -- Generate slots for the day
      WHILE slot_time < end_time LOOP
        -- Skip break times if defined
        IF break_start IS NOT NULL AND break_end IS NOT NULL THEN
          IF slot_time >= break_start AND slot_time < break_end THEN
            slot_time := break_end;
            CONTINUE;
          END IF;
        END IF;
        
        -- Insert the slot
        INSERT INTO appointment_slots (
          date,
          start_time,
          end_time,
          duration_minutes,
          is_available,
          max_capacity,
          current_capacity
        ) VALUES (
          curr_date,
          slot_time::TEXT,
          (slot_time + (p_slot_duration || ' minutes')::INTERVAL)::TIME::TEXT,
          p_slot_duration,
          true,
          1,
          0
        );
        
        -- Move to next slot
        slot_time := slot_time + (p_slot_duration || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    curr_date := curr_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Optimized function to get next available dates with counts
CREATE OR REPLACE FUNCTION get_next_available_dates_optimized(
  p_limit INTEGER DEFAULT 30,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  day_of_week INTEGER,
  available_slots BIGINT,
  open_time TIME,
  close_time TIME,
  is_special_hours BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(
      p_start_date,
      p_start_date + INTERVAL '60 days',
      '1 day'::INTERVAL
    )::DATE AS check_date
  ),
  date_availability AS (
    SELECT 
      dr.check_date,
      EXTRACT(DOW FROM dr.check_date)::INTEGER AS dow,
      sd.type AS special_type,
      COALESCE(sd.open_time, bh.open_time) AS open_time,
      COALESCE(sd.close_time, bh.close_time) AS close_time,
      sd.date IS NOT NULL AS is_special,
      bh.is_active AS is_regular_open
    FROM date_range dr
    LEFT JOIN special_dates sd ON sd.date = dr.check_date
    LEFT JOIN business_hours bh ON bh.day_of_week = EXTRACT(DOW FROM dr.check_date)
      AND bh.is_active = true
    WHERE dr.check_date >= p_start_date
      AND (sd.type != 'closure' OR sd.type IS NULL)
      AND (bh.is_active = true OR sd.type = 'special_hours')
  ),
  slot_counts AS (
    SELECT 
      date,
      COUNT(*) FILTER (WHERE is_available = true AND current_capacity < max_capacity) AS available_count
    FROM appointment_slots
    WHERE date >= p_start_date
      AND date <= p_start_date + INTERVAL '60 days'
      AND is_available = true
    GROUP BY date
  )
  SELECT 
    da.check_date AS date,
    da.dow AS day_of_week,
    COALESCE(sc.available_count, 0) AS available_slots,
    da.open_time::TIME,
    da.close_time::TIME,
    da.is_special AS is_special_hours
  FROM date_availability da
  LEFT JOIN slot_counts sc ON sc.date = da.check_date
  WHERE COALESCE(sc.available_count, 0) > 0
  ORDER BY da.check_date
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check and generate slots if needed
CREATE OR REPLACE FUNCTION ensure_slots_exist(
  p_date DATE,
  p_slot_duration INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if slots exist
  IF EXISTS (SELECT 1 FROM appointment_slots WHERE date = p_date LIMIT 1) THEN
    RETURN true;
  END IF;
  
  -- Generate slots for this date
  PERFORM generate_slots_for_date_range(p_date, p_date, p_slot_duration);
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION generate_slots_for_date_range IS 'Generates appointment slots for a date range in batch, checking business hours and special dates';
COMMENT ON FUNCTION get_next_available_dates_optimized IS 'Optimized function to get next available appointment dates with slot counts in a single query';
COMMENT ON FUNCTION ensure_slots_exist IS 'Ensures appointment slots exist for a given date, generating them if needed';