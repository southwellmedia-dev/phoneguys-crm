-- Create ticket_photos table for storing photo metadata
CREATE TABLE IF NOT EXISTS ticket_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    is_before_photo BOOLEAN DEFAULT FALSE,
    is_after_photo BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_photo_shares table for shareable links
CREATE TABLE IF NOT EXISTS ticket_photo_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ticket_photos_ticket_id ON ticket_photos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_photos_uploaded_at ON ticket_photos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_ticket_photos_tags ON ticket_photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ticket_photos_service_id ON ticket_photos(service_id);
CREATE INDEX IF NOT EXISTS idx_ticket_photo_shares_token ON ticket_photo_shares(token);
CREATE INDEX IF NOT EXISTS idx_ticket_photo_shares_expires_at ON ticket_photo_shares(expires_at);

-- Add RLS policies
ALTER TABLE ticket_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_photo_shares ENABLE ROW LEVEL SECURITY;

-- Policies for ticket_photos
CREATE POLICY "Users can view photos for tickets they have access to" ON ticket_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM repair_tickets rt
            WHERE rt.id = ticket_photos.ticket_id
            -- Add your access control logic here
        )
    );

CREATE POLICY "Users can upload photos for tickets they have access to" ON ticket_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM repair_tickets rt
            WHERE rt.id = ticket_photos.ticket_id
            -- Add your access control logic here
        )
    );

CREATE POLICY "Users can delete photos they uploaded" ON ticket_photos
    FOR DELETE
    USING (uploaded_by = auth.uid());

-- Policies for ticket_photo_shares
CREATE POLICY "Service role can manage photo shares" ON ticket_photo_shares
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_photos_updated_at
    BEFORE UPDATE ON ticket_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();