-- Temporarily disable RLS on all tables for development
-- This allows authenticated users to access all data

ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.repair_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Create basic policies for authenticated users (when RLS is re-enabled later)
-- These are commented out for now since we're disabling RLS

-- CREATE POLICY "Authenticated users can read all data" 
--   ON public.repair_tickets FOR SELECT 
--   TO authenticated 
--   USING (true);

-- CREATE POLICY "Authenticated users can insert data" 
--   ON public.repair_tickets FOR INSERT 
--   TO authenticated 
--   WITH CHECK (true);

-- CREATE POLICY "Authenticated users can update data" 
--   ON public.repair_tickets FOR UPDATE 
--   TO authenticated 
--   USING (true);

-- CREATE POLICY "Authenticated users can delete data" 
--   ON public.repair_tickets FOR DELETE 
--   TO authenticated 
--   USING (true);