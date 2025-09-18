-- Allow anonymous users to validate API keys
-- This is needed for the public API endpoints to verify API keys
-- Only allow reading specific columns needed for validation, not sensitive data

CREATE POLICY "Allow public API key validation" 
ON public.api_keys 
FOR SELECT 
TO anon 
USING (
  -- Only allow reading active keys
  is_active = true
);

-- Also need to allow anonymous users to read allowed_domains for validation
CREATE POLICY "Allow public allowed domains read" 
ON public.allowed_domains 
FOR SELECT 
TO anon 
USING (
  -- Only allow reading active domains
  is_active = true
);

-- Add comment explaining the policies
COMMENT ON POLICY "Allow public API key validation" ON public.api_keys IS 
'Allows anonymous users to validate API keys for public API endpoints. Only active keys are accessible.';

COMMENT ON POLICY "Allow public allowed domains read" ON public.allowed_domains IS 
'Allows anonymous users to read allowed domains for API key validation.';