-- Unified Comments System Migration
-- This creates a polymorphic comments system that works for both tickets and appointments

-- Main comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic association
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ticket', 'appointment', 'customer')),
  entity_id UUID NOT NULL,
  
  -- Comment data
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML for performance
  visibility TEXT NOT NULL DEFAULT 'internal' 
    CHECK (visibility IN ('internal', 'customer', 'system')),
  
  -- Metadata
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES users(id),
  
  -- Threading
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_id UUID, -- Root comment ID for efficient queries
  
  -- Rich features
  mentions UUID[], -- Array of mentioned user IDs
  attachments JSONB, -- File attachments metadata
  is_pinned BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_thread ON comments(thread_id, created_at) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user ON comments(user_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) 
  WHERE deleted_at IS NULL;

-- Reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);

-- Edit history table
CREATE TABLE IF NOT EXISTS comment_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_by UUID REFERENCES users(id),
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comment_edits_comment ON comment_edits(comment_id);

-- Read receipts for tracking
CREATE TABLE IF NOT EXISTS comment_reads (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_reads_user ON comment_reads(user_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reads ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments on accessible entities" ON comments
  FOR SELECT USING (
    -- For now, authenticated users can see all comments
    -- We'll refine this based on entity access later
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can edit their own comments" ON comments
  FOR UPDATE USING (
    auth.uid() = user_id AND deleted_at IS NULL
  );

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comments c 
      WHERE c.id = comment_id 
      AND auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can add reactions" ON comment_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can remove their reactions" ON comment_reactions
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Edit history policies
CREATE POLICY "View edits for visible comments" ON comment_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comments c 
      WHERE c.id = comment_id 
      AND auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "System tracks edits" ON comment_edits
  FOR INSERT WITH CHECK (
    auth.uid() = edited_by
  );

-- Read receipts policies
CREATE POLICY "Users can view read receipts" ON comment_reads
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can mark as read" ON comment_reads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their read receipts" ON comment_reads
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Function to automatically set thread_id for new comments
CREATE OR REPLACE FUNCTION set_comment_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply, inherit thread_id from parent
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT COALESCE(thread_id, id) INTO NEW.thread_id
    FROM comments
    WHERE id = NEW.parent_comment_id;
  ELSE
    -- This is a root comment, set thread_id to its own id
    NEW.thread_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_thread_id_trigger
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_thread_id();

-- Function to track edit history
CREATE OR REPLACE FUNCTION track_comment_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if content actually changed
  IF OLD.content != NEW.content THEN
    INSERT INTO comment_edits (comment_id, previous_content, edited_by, edited_at)
    VALUES (NEW.id, OLD.content, NEW.edited_by, NOW());
    
    NEW.edited_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_comment_edit_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION track_comment_edit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_updated_at_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- Enable real-time for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reactions;

-- Migrate existing ticket_notes to new comments table
INSERT INTO comments (
  entity_type,
  entity_id,
  content,
  visibility,
  user_id,
  created_at,
  is_pinned
)
SELECT 
  'ticket' as entity_type,
  ticket_id as entity_id,
  content,
  CASE 
    WHEN note_type = 'internal' THEN 'internal'
    WHEN note_type = 'customer' THEN 'customer'
    ELSE 'system'
  END as visibility,
  user_id,
  created_at,
  COALESCE(is_important, FALSE) as is_pinned
FROM ticket_notes
WHERE content IS NOT NULL AND content != '';

-- Migrate appointment notes (stored as JSON in notes field)
DO $$
DECLARE
  apt RECORD;
  notes_json JSONB;
  customer_notes TEXT;
  technician_notes TEXT;
BEGIN
  FOR apt IN 
    SELECT id, notes, created_at, updated_at, created_by
    FROM appointments 
    WHERE notes IS NOT NULL AND notes != ''
  LOOP
    BEGIN
      -- Try to parse as JSON
      notes_json := apt.notes::JSONB;
      
      -- Extract customer notes
      customer_notes := notes_json->>'customer_notes';
      IF customer_notes IS NOT NULL AND customer_notes != '' THEN
        INSERT INTO comments (
          entity_type,
          entity_id,
          content,
          visibility,
          user_id,
          created_at
        ) VALUES (
          'appointment',
          apt.id,
          customer_notes,
          'customer',
          apt.created_by,
          COALESCE(apt.updated_at, apt.created_at)
        );
      END IF;
      
      -- Extract technician notes
      technician_notes := notes_json->>'technician_notes';
      IF technician_notes IS NOT NULL AND technician_notes != '' THEN
        INSERT INTO comments (
          entity_type,
          entity_id,
          content,
          visibility,
          user_id,
          created_at
        ) VALUES (
          'appointment',
          apt.id,
          technician_notes,
          'internal',
          apt.created_by,
          COALESCE(apt.updated_at, apt.created_at)
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- If JSON parsing fails, treat as plain text
      IF apt.notes != '' THEN
        INSERT INTO comments (
          entity_type,
          entity_id,
          content,
          visibility,
          user_id,
          created_at
        ) VALUES (
          'appointment',
          apt.id,
          apt.notes,
          'internal',
          apt.created_by,
          COALESCE(apt.updated_at, apt.created_at)
        );
      END IF;
    END;
  END LOOP;
END $$;

-- Add comment counts to improve performance
CREATE OR REPLACE VIEW comment_counts AS
SELECT 
  entity_type,
  entity_id,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_comments,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND visibility = 'internal') as internal_comments,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND visibility = 'customer') as customer_comments,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_pinned = TRUE) as pinned_comments,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_resolved = FALSE AND parent_comment_id IS NULL) as unresolved_threads,
  MAX(created_at) FILTER (WHERE deleted_at IS NULL) as last_comment_at
FROM comments
GROUP BY entity_type, entity_id;

-- Grant permissions
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comment_reactions TO authenticated;
GRANT ALL ON comment_edits TO authenticated;
GRANT ALL ON comment_reads TO authenticated;
GRANT SELECT ON comment_counts TO authenticated;

-- Add helpful comments
COMMENT ON TABLE comments IS 'Unified comments system for all entities (tickets, appointments, etc.)';
COMMENT ON COLUMN comments.entity_type IS 'Type of entity this comment belongs to';
COMMENT ON COLUMN comments.entity_id IS 'UUID of the entity this comment belongs to';
COMMENT ON COLUMN comments.visibility IS 'Who can see this comment: internal (team only), customer (customer visible), system (auto-generated)';
COMMENT ON COLUMN comments.thread_id IS 'Root comment ID for efficient thread queries';
COMMENT ON COLUMN comments.mentions IS 'Array of user IDs mentioned in this comment';
COMMENT ON COLUMN comments.attachments IS 'JSON metadata for file attachments';