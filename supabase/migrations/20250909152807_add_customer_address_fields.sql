-- Add address fields to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS city varchar(100);

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS state varchar(50);

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS zip varchar(20);

-- Add comments for documentation
COMMENT ON COLUMN public.customers.address IS 'Street address of the customer';
COMMENT ON COLUMN public.customers.city IS 'City where the customer is located';
COMMENT ON COLUMN public.customers.state IS 'State or province where the customer is located';
COMMENT ON COLUMN public.customers.zip IS 'ZIP or postal code of the customer';

-- Create indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_customers_city ON public.customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON public.customers(state);
CREATE INDEX IF NOT EXISTS idx_customers_zip ON public.customers(zip);