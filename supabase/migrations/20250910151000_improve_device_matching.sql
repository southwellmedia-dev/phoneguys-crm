-- Improve device matching function to handle different model number formats and variations

DROP FUNCTION IF EXISTS find_device_for_sync(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION find_device_for_sync(
  p_external_id TEXT,
  p_brand TEXT,
  p_model_name TEXT,
  p_model_number TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_device_id UUID;
  v_clean_model_name TEXT;
BEGIN
  -- First try to find by external_id if provided
  IF p_external_id IS NOT NULL THEN
    SELECT id INTO v_device_id 
    FROM public.devices 
    WHERE external_id = p_external_id
    LIMIT 1;
    
    IF v_device_id IS NOT NULL THEN
      RETURN v_device_id;
    END IF;
  END IF;
  
  -- Clean the model name for comparison (remove 'Apple' prefix if present)
  v_clean_model_name := REGEXP_REPLACE(p_model_name, '^Apple\s+', '', 'i');
  
  -- Try exact match on model_name and brand
  SELECT id INTO v_device_id 
  FROM public.devices 
  WHERE (
    LOWER(model_name) = LOWER(p_model_name) 
    OR LOWER(model_name) = LOWER(v_clean_model_name)
  )
  AND LOWER(brand) = LOWER(p_brand)
  LIMIT 1;
  
  IF v_device_id IS NOT NULL THEN
    RETURN v_device_id;
  END IF;
  
  -- Try fuzzy match for iPhone models specifically
  -- This handles cases like "Apple iPhone 16 Pro Max" vs "iPhone 16 Pro Max"
  IF p_brand = 'Apple' THEN
    SELECT id INTO v_device_id 
    FROM public.devices 
    WHERE LOWER(brand) = LOWER(p_brand)
      AND (
        -- Check if both contain the same iPhone model
        (model_name ILIKE '%iPhone 16 Pro Max%' AND p_model_name ILIKE '%iPhone 16 Pro Max%') OR
        (model_name ILIKE '%iPhone 16 Pro%' AND p_model_name ILIKE '%iPhone 16 Pro%' AND 
         model_name NOT ILIKE '%Max%' AND p_model_name NOT ILIKE '%Max%') OR
        (model_name ILIKE '%iPhone 16 Plus%' AND p_model_name ILIKE '%iPhone 16 Plus%') OR
        (model_name ILIKE '%iPhone 16%' AND p_model_name ILIKE '%iPhone 16%' AND 
         model_name NOT ILIKE '%Pro%' AND p_model_name NOT ILIKE '%Pro%' AND
         model_name NOT ILIKE '%Plus%' AND p_model_name NOT ILIKE '%Plus%') OR
        -- Same for iPhone 15 series
        (model_name ILIKE '%iPhone 15 Pro Max%' AND p_model_name ILIKE '%iPhone 15 Pro Max%') OR
        (model_name ILIKE '%iPhone 15 Pro%' AND p_model_name ILIKE '%iPhone 15 Pro%' AND 
         model_name NOT ILIKE '%Max%' AND p_model_name NOT ILIKE '%Max%') OR
        (model_name ILIKE '%iPhone 15 Plus%' AND p_model_name ILIKE '%iPhone 15 Plus%') OR
        (model_name ILIKE '%iPhone 15%' AND p_model_name ILIKE '%iPhone 15%' AND 
         model_name NOT ILIKE '%Pro%' AND p_model_name NOT ILIKE '%Pro%' AND
         model_name NOT ILIKE '%Plus%' AND p_model_name NOT ILIKE '%Plus%')
      )
    LIMIT 1;
    
    IF v_device_id IS NOT NULL THEN
      RETURN v_device_id;
    END IF;
  END IF;
  
  -- Try fuzzy match for Samsung models
  IF p_brand = 'Samsung' THEN
    SELECT id INTO v_device_id 
    FROM public.devices 
    WHERE LOWER(brand) = LOWER(p_brand)
      AND (
        -- Galaxy S series
        (model_name ILIKE '%Galaxy S24 Ultra%' AND p_model_name ILIKE '%Galaxy S24 Ultra%') OR
        (model_name ILIKE '%Galaxy S24+%' AND p_model_name ILIKE '%Galaxy S24+%') OR
        (model_name ILIKE '%Galaxy S24 Plus%' AND p_model_name ILIKE '%Galaxy S24 Plus%') OR
        (model_name ILIKE '%Galaxy S24%' AND p_model_name ILIKE '%Galaxy S24%' AND 
         model_name NOT ILIKE '%Ultra%' AND p_model_name NOT ILIKE '%Ultra%' AND
         model_name NOT ILIKE '%Plus%' AND p_model_name NOT ILIKE '%Plus%' AND
         model_name NOT ILIKE '%+%' AND p_model_name NOT ILIKE '%+%') OR
        -- Galaxy Z series
        (model_name ILIKE '%Galaxy Z Fold%' AND p_model_name ILIKE '%Galaxy Z Fold%') OR
        (model_name ILIKE '%Galaxy Z Flip%' AND p_model_name ILIKE '%Galaxy Z Flip%')
      )
    LIMIT 1;
    
    IF v_device_id IS NOT NULL THEN
      RETURN v_device_id;
    END IF;
  END IF;
  
  -- Try with model_number if provided (handle different formats)
  IF p_model_number IS NOT NULL THEN
    SELECT id INTO v_device_id 
    FROM public.devices 
    WHERE LOWER(brand) = LOWER(p_brand)
      AND (
        LOWER(model_number) = LOWER(p_model_number) OR
        -- Handle Apple model number variations (A3297 vs 02A0)
        LOWER(model_number) = LOWER(REGEXP_REPLACE(p_model_number, '^A', '', 'i')) OR
        LOWER(REGEXP_REPLACE(model_number, '^A', '', 'i')) = LOWER(p_model_number) OR
        -- Handle with/without leading zeros
        LOWER(REGEXP_REPLACE(model_number, '^0+', '', 'i')) = LOWER(REGEXP_REPLACE(p_model_number, '^0+', '', 'i'))
      )
    LIMIT 1;
  END IF;
  
  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- Should find iPhone 16 Pro Max even with different model numbers
-- SELECT find_device_for_sync(NULL, 'Apple', 'Apple iPhone 16 Pro Max', 'A3297');