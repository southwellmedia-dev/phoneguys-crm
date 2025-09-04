-- Add missing columns that exist in local database but not in migrations

-- Add deposit_amount to repair_tickets
ALTER TABLE public.repair_tickets 
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add missing columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_zip ON public.customers(zip_code);
CREATE INDEX IF NOT EXISTS idx_repair_tickets_deposit ON public.repair_tickets(deposit_amount);

-- Add comment for deposit_amount
COMMENT ON COLUMN public.repair_tickets.deposit_amount IS 'Deposit amount collected from customer for the repair';