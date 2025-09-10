-- Add sync-related columns to devices table for better tracking

-- Add external ID to track the source system ID (e.g., TechSpecs ID)
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add sync source to track where the device data came from
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS sync_source TEXT;

-- Add last synced timestamp
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add flag to mark devices that need syncing
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS needs_sync BOOLEAN DEFAULT false;

-- Add local storage URL for thumbnails stored in Supabase Storage
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS local_thumbnail_url TEXT;

-- Add external thumbnail URL (original source) for reference
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS external_thumbnail_url TEXT;

-- Add index for external_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_external_id ON public.devices(external_id);

-- Add index for sync queries
CREATE INDEX IF NOT EXISTS idx_devices_needs_sync ON public.devices(needs_sync) WHERE needs_sync = true;

-- Add index for sync source
CREATE INDEX IF NOT EXISTS idx_devices_sync_source ON public.devices(sync_source);

-- Create a function to mark devices for sync
CREATE OR REPLACE FUNCTION mark_device_for_sync(device_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.devices 
  SET needs_sync = true, 
      updated_at = CURRENT_TIMESTAMP 
  WHERE id = device_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find device by external ID or model/brand
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
    OR LOWER(model_name) LIKE LOWER('%' || v_clean_model_name || '%')
  )
  AND LOWER(brand) = LOWER(p_brand)
  LIMIT 1;
  
  IF v_device_id IS NOT NULL THEN
    RETURN v_device_id;
  END IF;
  
  -- Try fuzzy match for similar model names
  SELECT id INTO v_device_id 
  FROM public.devices 
  WHERE LOWER(brand) = LOWER(p_brand)
    AND (
      -- Check if both contain the same iPhone model (e.g., both have 'iPhone 16 Pro Max')
      (model_name ILIKE '%iPhone 16 Pro Max%' AND p_model_name ILIKE '%iPhone 16 Pro Max%') OR
      (model_name ILIKE '%iPhone 16 Pro%' AND p_model_name ILIKE '%iPhone 16 Pro%' AND 
       model_name NOT ILIKE '%Max%' AND p_model_name NOT ILIKE '%Max%') OR
      (model_name ILIKE '%iPhone 16 Plus%' AND p_model_name ILIKE '%iPhone 16 Plus%') OR
      (model_name ILIKE '%iPhone 16%' AND p_model_name ILIKE '%iPhone 16%' AND 
       model_name NOT ILIKE '%Pro%' AND p_model_name NOT ILIKE '%Pro%' AND
       model_name NOT ILIKE '%Plus%' AND p_model_name NOT ILIKE '%Plus%')
    )
  LIMIT 1;
  
  IF v_device_id IS NOT NULL THEN
    RETURN v_device_id;
  END IF;
  
  -- Try with model_number if provided (but ignore if formats don't match)
  IF p_model_number IS NOT NULL THEN
    SELECT id INTO v_device_id 
    FROM public.devices 
    WHERE (
      LOWER(model_number) = LOWER(p_model_number)
      -- Also check if one has 'A' prefix and other doesn't
      OR LOWER(model_number) = LOWER(REGEXP_REPLACE(p_model_number, '^A', '', 'i'))
      OR LOWER(REGEXP_REPLACE(model_number, '^A', '', 'i')) = LOWER(p_model_number)
    )
    AND LOWER(brand) = LOWER(p_brand)
    LIMIT 1;
  END IF;
  
  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain columns
COMMENT ON COLUMN public.devices.external_id IS 'External system ID (e.g., TechSpecs product ID)';
COMMENT ON COLUMN public.devices.sync_source IS 'Source of the device data (techspecs, manual, etc.)';
COMMENT ON COLUMN public.devices.last_synced_at IS 'Last time this device was synced from external source';
COMMENT ON COLUMN public.devices.needs_sync IS 'Flag to indicate device needs to be synced';
COMMENT ON COLUMN public.devices.local_thumbnail_url IS 'URL to thumbnail stored in Supabase Storage';
COMMENT ON COLUMN public.devices.external_thumbnail_url IS 'Original external thumbnail URL for reference';