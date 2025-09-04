-- Create manufacturers table
CREATE TABLE IF NOT EXISTS public.manufacturers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    total_repairs_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create device_models table
CREATE TABLE IF NOT EXISTS public.device_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manufacturer_id UUID NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
    model_name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    release_year INTEGER,
    device_type VARCHAR(50) CHECK (device_type IN ('smartphone', 'tablet', 'laptop', 'smartwatch', 'desktop', 'other')),
    is_active BOOLEAN DEFAULT true,
    total_repairs_count INTEGER DEFAULT 0,
    common_issues TEXT[],
    average_repair_time_hours DECIMAL(5,2),
    typical_repair_cost DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(manufacturer_id, model_name, model_number)
);

-- Add device_model_id to repair_tickets table
ALTER TABLE public.repair_tickets 
ADD COLUMN IF NOT EXISTS device_model_id UUID REFERENCES public.device_models(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON public.manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_manufacturers_active ON public.manufacturers(is_active);
CREATE INDEX IF NOT EXISTS idx_device_models_manufacturer ON public.device_models(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_device_models_name ON public.device_models(model_name);
CREATE INDEX IF NOT EXISTS idx_device_models_active ON public.device_models(is_active);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_device_model ON public.repair_tickets(device_model_id);

-- Create trigger to update manufacturers updated_at
CREATE OR REPLACE FUNCTION update_manufacturers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manufacturers_timestamp
    BEFORE UPDATE ON public.manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION update_manufacturers_updated_at();

-- Create trigger to update device_models updated_at
CREATE OR REPLACE FUNCTION update_device_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_models_timestamp
    BEFORE UPDATE ON public.device_models
    FOR EACH ROW
    EXECUTE FUNCTION update_device_models_updated_at();

-- Function to update repair counts when a repair is created
CREATE OR REPLACE FUNCTION update_device_repair_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.device_model_id IS NOT NULL THEN
        -- Update device model count
        UPDATE public.device_models 
        SET total_repairs_count = total_repairs_count + 1
        WHERE id = NEW.device_model_id;
        
        -- Update manufacturer count
        UPDATE public.manufacturers 
        SET total_repairs_count = total_repairs_count + 1
        WHERE id = (SELECT manufacturer_id FROM public.device_models WHERE id = NEW.device_model_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_repair_counts
    AFTER INSERT ON public.repair_tickets
    FOR EACH ROW
    WHEN (NEW.device_model_id IS NOT NULL)
    EXECUTE FUNCTION update_device_repair_counts();

-- Function to migrate existing repair data to device models
CREATE OR REPLACE FUNCTION migrate_existing_repairs_to_devices()
RETURNS void AS $$
DECLARE
    repair_record RECORD;
    manufacturer_id UUID;
    model_id UUID;
BEGIN
    -- Loop through distinct device_brand and device_model combinations
    FOR repair_record IN 
        SELECT DISTINCT device_brand, device_model 
        FROM public.repair_tickets 
        WHERE device_brand IS NOT NULL AND device_model IS NOT NULL
        ORDER BY device_brand, device_model
    LOOP
        -- Insert or get manufacturer
        INSERT INTO public.manufacturers (name)
        VALUES (repair_record.device_brand)
        ON CONFLICT (name) DO NOTHING;
        
        SELECT id INTO manufacturer_id 
        FROM public.manufacturers 
        WHERE name = repair_record.device_brand;
        
        -- Insert or get device model
        INSERT INTO public.device_models (manufacturer_id, model_name, device_type)
        VALUES (manufacturer_id, repair_record.device_model, 'smartphone')
        ON CONFLICT (manufacturer_id, model_name, model_number) DO NOTHING;
        
        SELECT id INTO model_id
        FROM public.device_models dm
        WHERE dm.manufacturer_id = manufacturer_id 
        AND dm.model_name = repair_record.device_model;
        
        -- Update repair tickets with device_model_id
        UPDATE public.repair_tickets
        SET device_model_id = model_id
        WHERE device_brand = repair_record.device_brand 
        AND device_model = repair_record.device_model
        AND device_model_id IS NULL;
    END LOOP;
    
    -- Update repair counts
    UPDATE public.device_models dm
    SET total_repairs_count = (
        SELECT COUNT(*) 
        FROM public.repair_tickets rt 
        WHERE rt.device_model_id = dm.id
    );
    
    UPDATE public.manufacturers m
    SET total_repairs_count = (
        SELECT COUNT(*) 
        FROM public.repair_tickets rt 
        JOIN public.device_models dm ON rt.device_model_id = dm.id
        WHERE dm.manufacturer_id = m.id
    );
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_existing_repairs_to_devices();

-- Insert some common manufacturers and models (commented out - will come from seed.sql)
-- INSERT INTO public.manufacturers (name, country) VALUES
--     ('Apple', 'United States'),
--     ('Samsung', 'South Korea'),
--     ('Google', 'United States'),
--     ('OnePlus', 'China'),
--     ('Motorola', 'United States'),
--     ('LG', 'South Korea'),
--     ('Nokia', 'Finland'),
--     ('Sony', 'Japan'),
--     ('Huawei', 'China'),
--     ('Xiaomi', 'China')
-- ON CONFLICT (name) DO NOTHING;

-- Insert some common device models (commented out - will come from seed.sql)
-- INSERT INTO public.device_models (manufacturer_id, model_name, device_type, release_year, common_issues)
-- SELECT 
--     m.id,
--     model.name,
--     model.type,
--     model.year,
--     model.issues
-- FROM public.manufacturers m
-- CROSS JOIN (
--     VALUES 
--         ('Apple', 'iPhone 15 Pro Max', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 15 Pro', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 15', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 14 Pro Max', 'smartphone', 2022, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 14 Pro', 'smartphone', 2022, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 14', 'smartphone', 2022, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPhone 13', 'smartphone', 2021, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Apple', 'iPad Pro 12.9', 'tablet', 2023, ARRAY['screen_crack', 'charging_port']::TEXT[]),
--         ('Apple', 'iPad Air', 'tablet', 2023, ARRAY['screen_crack', 'software_issue']::TEXT[]),
--         ('Samsung', 'Galaxy S24 Ultra', 'smartphone', 2024, ARRAY['screen_crack', 'camera_issue']::TEXT[]),
--         ('Samsung', 'Galaxy S24', 'smartphone', 2024, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Samsung', 'Galaxy S23 Ultra', 'smartphone', 2023, ARRAY['screen_crack', 'camera_issue']::TEXT[]),
--         ('Samsung', 'Galaxy S23', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Samsung', 'Galaxy Z Fold 5', 'smartphone', 2023, ARRAY['screen_crack', 'hinge_issue']::TEXT[]),
--         ('Samsung', 'Galaxy Z Flip 5', 'smartphone', 2023, ARRAY['screen_crack', 'hinge_issue']::TEXT[]),
--         ('Google', 'Pixel 8 Pro', 'smartphone', 2023, ARRAY['screen_crack', 'camera_issue']::TEXT[]),
--         ('Google', 'Pixel 8', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[]),
--         ('Google', 'Pixel 7 Pro', 'smartphone', 2022, ARRAY['screen_crack', 'software_issue']::TEXT[]),
--         ('OnePlus', '12', 'smartphone', 2024, ARRAY['screen_crack', 'charging_port']::TEXT[]),
--         ('OnePlus', '11', 'smartphone', 2023, ARRAY['screen_crack', 'battery_issue']::TEXT[])
-- ) AS model(manufacturer_name, name, type, year, issues)
-- WHERE m.name = model.manufacturer_name
-- ON CONFLICT (manufacturer_id, model_name, model_number) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.manufacturers TO authenticated;
GRANT ALL ON public.device_models TO authenticated;

-- RLS Policies (disabled for now, similar to other tables)
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (temporary during development)
CREATE POLICY "Allow all operations on manufacturers" ON public.manufacturers
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on device_models" ON public.device_models
    FOR ALL USING (true);