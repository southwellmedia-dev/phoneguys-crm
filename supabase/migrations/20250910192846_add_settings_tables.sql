-- Create store_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name TEXT,
    store_email TEXT,
    store_phone TEXT,
    store_address TEXT,
    store_city TEXT,
    store_state TEXT,
    store_zip TEXT,
    store_country TEXT DEFAULT 'USA',
    store_website TEXT,
    store_description TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointment_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.appointment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_duration_minutes INTEGER DEFAULT 30,
    buffer_time_minutes INTEGER DEFAULT 0,
    max_advance_days INTEGER DEFAULT 30,
    min_advance_hours INTEGER DEFAULT 2,
    max_appointments_per_slot INTEGER DEFAULT 1,
    allow_same_day_appointments BOOLEAN DEFAULT true,
    allow_weekend_appointments BOOLEAN DEFAULT true,
    send_confirmation_email BOOLEAN DEFAULT true,
    send_reminder_email BOOLEAN DEFAULT true,
    reminder_hours_before INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store settings if none exist
INSERT INTO public.store_settings (
    store_name,
    store_email,
    store_phone,
    tax_rate,
    currency,
    timezone
) 
SELECT 
    'The Phone Guys',
    'info@phoneguys.com',
    '(555) 123-4567',
    8.25,
    'USD',
    'America/New_York'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Insert default appointment settings if none exist
INSERT INTO public.appointment_settings (
    slot_duration_minutes,
    buffer_time_minutes,
    max_advance_days,
    min_advance_hours,
    max_appointments_per_slot,
    allow_same_day_appointments,
    allow_weekend_appointments,
    send_confirmation_email,
    send_reminder_email,
    reminder_hours_before
)
SELECT 
    30,
    0,
    30,
    2,
    1,
    true,
    true,
    true,
    true,
    24
WHERE NOT EXISTS (SELECT 1 FROM public.appointment_settings);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for store_settings
CREATE POLICY "Store settings are viewable by authenticated users" 
    ON public.store_settings FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Store settings are editable by admin users" 
    ON public.store_settings FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create policies for appointment_settings
CREATE POLICY "Appointment settings are viewable by authenticated users" 
    ON public.appointment_settings FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Appointment settings are editable by admin users" 
    ON public.appointment_settings FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_settings_updated_at 
    BEFORE UPDATE ON public.store_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_settings_updated_at 
    BEFORE UPDATE ON public.appointment_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();