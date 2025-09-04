-- Admin Features Migration: Devices, Services, and Customer Device Profiles
-- This migration adds comprehensive admin management capabilities

-- 1. Master Devices Table - Core device database
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manufacturer_id UUID REFERENCES public.manufacturers(id) ON DELETE SET NULL,
    model_name VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    device_type VARCHAR(50) CHECK (device_type IN ('smartphone', 'tablet', 'laptop', 'smartwatch', 'desktop', 'earbuds', 'other')),
    release_year INTEGER,
    
    -- Visual and descriptive fields
    thumbnail_url TEXT,
    image_url TEXT,
    description TEXT,
    
    -- Technical specifications (stored as JSONB for flexibility)
    specifications JSONB DEFAULT '{}',
    screen_size VARCHAR(50),
    storage_options TEXT[] DEFAULT '{}',
    color_options TEXT[] DEFAULT '{}',
    
    -- Repair-related data
    common_issues TEXT[] DEFAULT '{}',
    average_repair_cost DECIMAL(10,2),
    average_repair_time_hours DECIMAL(5,2),
    parts_availability VARCHAR(50) CHECK (parts_availability IN ('readily_available', 'available', 'limited', 'scarce', 'discontinued')),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    total_repairs_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_device_model UNIQUE(manufacturer_id, model_name, model_number)
);

-- 2. Services Table - Service catalog
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) CHECK (category IN (
        'screen_repair', 'battery_replacement', 'charging_port', 
        'water_damage', 'diagnostic', 'software_issue', 
        'camera_repair', 'speaker_repair', 'button_repair',
        'motherboard_repair', 'data_recovery', 'other'
    )),
    base_price DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    requires_parts BOOLEAN DEFAULT false,
    skill_level VARCHAR(50) CHECK (skill_level IN ('basic', 'intermediate', 'advanced', 'expert')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customer Devices Table - Links customers to their devices
CREATE TABLE IF NOT EXISTS public.customer_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    
    -- Device-specific customer data
    serial_number VARCHAR(200),
    imei VARCHAR(200),
    color VARCHAR(100),
    storage_size VARCHAR(50),
    
    -- Customer-specific data
    nickname VARCHAR(100),
    purchase_date DATE,
    warranty_expires DATE,
    condition VARCHAR(50) CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'broken')),
    
    -- History and notes
    previous_repairs JSONB DEFAULT '[]',
    notes TEXT,
    
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_customer_serial UNIQUE(customer_id, serial_number),
    CONSTRAINT unique_customer_imei UNIQUE(customer_id, imei)
);

-- 4. Device Services Table - Service compatibility and pricing per device
CREATE TABLE IF NOT EXISTS public.device_services (
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    typical_price DECIMAL(10,2),
    typical_duration_minutes INTEGER,
    notes TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (device_id, service_id)
);

-- 5. Ticket Services Junction Table - Services performed on a ticket
CREATE TABLE IF NOT EXISTS public.ticket_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.repair_tickets(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    technician_notes TEXT,
    performed_by UUID REFERENCES public.users(id),
    performed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_ticket_service UNIQUE(ticket_id, service_id)
);

-- 6. Update repair_tickets table
ALTER TABLE public.repair_tickets 
ADD COLUMN IF NOT EXISTS customer_device_id UUID REFERENCES public.customer_devices(id) ON DELETE SET NULL;

ALTER TABLE public.repair_tickets
ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_manufacturer ON public.devices(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_devices_model_name ON public.devices(model_name);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON public.devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_active ON public.devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_search ON public.devices USING gin(to_tsvector('english', model_name || ' ' || COALESCE(model_number, '')));

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);

CREATE INDEX IF NOT EXISTS idx_customer_devices_customer ON public.customer_devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_devices_device ON public.customer_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_devices_active ON public.customer_devices(is_active);

CREATE INDEX IF NOT EXISTS idx_device_services_device ON public.device_services(device_id);
CREATE INDEX IF NOT EXISTS idx_device_services_service ON public.device_services(service_id);

CREATE INDEX IF NOT EXISTS idx_ticket_services_ticket ON public.ticket_services(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_services_service ON public.ticket_services(service_id);

-- 8. Create update triggers for timestamps
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_timestamp
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION update_devices_updated_at();

CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_timestamp
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

CREATE OR REPLACE FUNCTION update_customer_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_devices_timestamp
    BEFORE UPDATE ON public.customer_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_devices_updated_at();

-- 9. Function to update device repair counts
CREATE OR REPLACE FUNCTION update_device_repair_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.device_id IS NOT NULL THEN
            UPDATE public.devices 
            SET total_repairs_count = total_repairs_count + 1
            WHERE id = NEW.device_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.device_id IS NOT NULL THEN
            UPDATE public.devices 
            SET total_repairs_count = total_repairs_count - 1
            WHERE id = OLD.device_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.device_id IS DISTINCT FROM NEW.device_id THEN
            IF OLD.device_id IS NOT NULL THEN
                UPDATE public.devices 
                SET total_repairs_count = total_repairs_count - 1
                WHERE id = OLD.device_id;
            END IF;
            IF NEW.device_id IS NOT NULL THEN
                UPDATE public.devices 
                SET total_repairs_count = total_repairs_count + 1
                WHERE id = NEW.device_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_repairs_count
    AFTER INSERT OR UPDATE OR DELETE ON public.repair_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_device_repair_count();

-- 10. Insert common services
INSERT INTO public.services (name, category, base_price, estimated_duration_minutes, requires_parts, skill_level, sort_order) VALUES
    ('Screen Replacement', 'screen_repair', 150.00, 60, true, 'intermediate', 1),
    ('Battery Replacement', 'battery_replacement', 80.00, 45, true, 'intermediate', 2),
    ('Charging Port Repair', 'charging_port', 90.00, 60, true, 'intermediate', 3),
    ('Water Damage Treatment', 'water_damage', 120.00, 120, false, 'advanced', 4),
    ('Diagnostic Service', 'diagnostic', 40.00, 30, false, 'basic', 5),
    ('Software Troubleshooting', 'software_issue', 50.00, 45, false, 'basic', 6),
    ('Camera Module Replacement', 'camera_repair', 100.00, 60, true, 'intermediate', 7),
    ('Speaker Replacement', 'speaker_repair', 70.00, 45, true, 'intermediate', 8),
    ('Power Button Repair', 'button_repair', 60.00, 45, true, 'intermediate', 9),
    ('Volume Button Repair', 'button_repair', 60.00, 45, true, 'intermediate', 10),
    ('Home Button Repair', 'button_repair', 70.00, 60, true, 'intermediate', 11),
    ('Motherboard Repair', 'motherboard_repair', 200.00, 180, true, 'expert', 12),
    ('Data Recovery', 'data_recovery', 150.00, 120, false, 'advanced', 13),
    ('Virus Removal', 'software_issue', 60.00, 60, false, 'basic', 14),
    ('OS Installation', 'software_issue', 80.00, 90, false, 'intermediate', 15)
ON CONFLICT (name) DO NOTHING;

-- 11. Migrate existing device_models to devices table
INSERT INTO public.devices (
    manufacturer_id,
    model_name,
    model_number,
    device_type,
    release_year,
    common_issues,
    average_repair_time_hours,
    average_repair_cost,
    specifications,
    is_active,
    total_repairs_count
)
SELECT 
    dm.manufacturer_id,
    dm.model_name,
    dm.model_number,
    dm.device_type,
    dm.release_year,
    dm.common_issues,
    dm.average_repair_time_hours,
    dm.typical_repair_cost,
    dm.specifications,
    dm.is_active,
    dm.total_repairs_count
FROM public.device_models dm
WHERE NOT EXISTS (
    SELECT 1 FROM public.devices d 
    WHERE d.manufacturer_id = dm.manufacturer_id 
    AND d.model_name = dm.model_name 
    AND COALESCE(d.model_number, '') = COALESCE(dm.model_number, '')
);

-- 12. Add some sample devices with thumbnails (commented out - will come from seed.sql)
-- INSERT INTO public.devices (manufacturer_id, model_name, device_type, release_year, thumbnail_url, storage_options, color_options, parts_availability) 
-- SELECT 
--     m.id,
--     'iPhone 15 Pro Max',
--     'smartphone',
--     2023,
--     'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-hero?wid=200',
--     ARRAY['256GB', '512GB', '1TB'],
--     ARRAY['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
--     'readily_available'
-- FROM public.manufacturers m WHERE m.name = 'Apple'
-- ON CONFLICT DO NOTHING;

-- 13. Disable RLS for new tables (matching existing pattern)
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_services DISABLE ROW LEVEL SECURITY;

-- Migration complete
COMMENT ON TABLE public.devices IS 'Master device database for all supported devices';
COMMENT ON TABLE public.services IS 'Service catalog with pricing and duration estimates';
COMMENT ON TABLE public.customer_devices IS 'Customer-owned devices with serial numbers and history';
COMMENT ON TABLE public.device_services IS 'Service compatibility and pricing per device type';
COMMENT ON TABLE public.ticket_services IS 'Services performed on repair tickets';