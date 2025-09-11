-- Enable real-time for internal_notifications table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'internal_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE internal_notifications;
        RAISE NOTICE 'Added internal_notifications to real-time publication';
    ELSE
        RAISE NOTICE 'internal_notifications already in real-time publication';
    END IF;
END $$;