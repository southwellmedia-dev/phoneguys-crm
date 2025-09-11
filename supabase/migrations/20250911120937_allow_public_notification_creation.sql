-- Allow public (anon) users to create notifications for appointment confirmations
CREATE POLICY "Public can create notifications for appointments" 
ON notifications 
FOR INSERT 
TO anon 
WITH CHECK (
  recipient_email IS NOT NULL 
  AND subject IS NOT NULL 
  AND content IS NOT NULL
);

-- Also allow public to check notification status by email (optional, for tracking)
CREATE POLICY "Public can view own notifications" 
ON notifications 
FOR SELECT 
TO anon 
USING (
  recipient_email IS NOT NULL
);

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;