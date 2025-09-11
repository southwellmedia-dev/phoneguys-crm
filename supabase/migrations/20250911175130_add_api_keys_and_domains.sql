-- Create API keys table for external integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(10) NOT NULL, -- First 8 chars of key for identification
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '["form_submission"]'::jsonb,
  rate_limit_per_hour INTEGER DEFAULT 100,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create allowed domains table for CORS
CREATE TABLE IF NOT EXISTS public.allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(api_key_id, domain)
);

-- Create API request logs for tracking
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  origin VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX idx_allowed_domains_api_key_id ON public.allowed_domains(api_key_id);
CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);
CREATE INDEX idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs(created_at);

-- Add RLS policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- API keys policies - only admins can manage
CREATE POLICY "Admins can view all API keys" ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create API keys" ON public.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update API keys" ON public.api_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete API keys" ON public.api_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

-- Allowed domains policies
CREATE POLICY "Admins can view allowed domains" ON public.allowed_domains
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage allowed domains" ON public.allowed_domains
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

-- API request logs policies
CREATE POLICY "Admins can view API logs" ON public.api_request_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'admin'
    )
  );

-- Allow anonymous inserts for logging (API will handle this)
CREATE POLICY "Allow API log inserts" ON public.api_request_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add website integration settings to store_settings if not exists
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS website_integration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_form_origins TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS form_submission_email TEXT,
ADD COLUMN IF NOT EXISTS auto_create_appointments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_api_key BOOLEAN DEFAULT true;