-- Create active_timers table for persistent timer state
CREATE TABLE IF NOT EXISTS active_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pause_time TIMESTAMPTZ,
  total_paused_seconds INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT false,
  auto_paused_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_timer_per_user UNIQUE(user_id, ticket_id),
  CONSTRAINT unique_active_timer_per_ticket UNIQUE(ticket_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_timers_user ON active_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_ticket ON active_timers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_heartbeat ON active_timers(last_heartbeat);

-- Function to calculate elapsed seconds
CREATE OR REPLACE FUNCTION calculate_timer_elapsed_seconds(timer active_timers) 
RETURNS INTEGER AS $$
DECLARE
  elapsed_seconds INTEGER;
BEGIN
  IF timer.is_paused THEN
    -- If paused, calculate time up to pause
    elapsed_seconds := EXTRACT(EPOCH FROM (timer.pause_time - timer.start_time))::INTEGER;
  ELSE
    -- If running, calculate current elapsed time
    elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - timer.start_time))::INTEGER;
  END IF;
  
  -- Subtract total paused time
  elapsed_seconds := elapsed_seconds - COALESCE(timer.total_paused_seconds, 0);
  
  RETURN GREATEST(elapsed_seconds, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-pause timers after 4 hours
CREATE OR REPLACE FUNCTION auto_pause_long_running_timers() 
RETURNS void AS $$
BEGIN
  UPDATE active_timers
  SET 
    is_paused = true,
    pause_time = NOW(),
    auto_paused_at = NOW(),
    updated_at = NOW()
  WHERE 
    is_paused = false 
    AND calculate_timer_elapsed_seconds(active_timers.*) > 14400 -- 4 hours in seconds
    AND auto_paused_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale timers (no heartbeat for 1 hour)
CREATE OR REPLACE FUNCTION cleanup_stale_timers() 
RETURNS void AS $$
BEGIN
  DELETE FROM active_timers
  WHERE last_heartbeat < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;

-- Users can see all active timers (for display)
CREATE POLICY "Users can view active timers" ON active_timers
  FOR SELECT USING (true);

-- Users can manage their own timers
CREATE POLICY "Users can manage own timers" ON active_timers
  FOR ALL USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to timers" ON active_timers
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_active_timer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_active_timers_updated_at
  BEFORE UPDATE ON active_timers
  FOR EACH ROW
  EXECUTE FUNCTION update_active_timer_updated_at();

-- View for active timers with calculated elapsed time
CREATE OR REPLACE VIEW active_timers_with_elapsed AS
SELECT 
  at.*,
  calculate_timer_elapsed_seconds(at) as elapsed_seconds,
  rt.ticket_number,
  rt.status as ticket_status,
  c.name as customer_name,
  u.full_name as user_name,
  u.email as user_email
FROM active_timers at
JOIN repair_tickets rt ON at.ticket_id = rt.id
JOIN customers c ON rt.customer_id = c.id
JOIN users u ON at.user_id = u.id;

-- Grant access to the view
GRANT SELECT ON active_timers_with_elapsed TO authenticated;
GRANT SELECT ON active_timers_with_elapsed TO service_role;

-- Migration: Move any existing timer_started_at data to active_timers
INSERT INTO active_timers (ticket_id, user_id, start_time)
SELECT 
  rt.id as ticket_id,
  COALESCE(rt.assigned_to, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)) as user_id,
  rt.timer_started_at as start_time
FROM repair_tickets rt
WHERE rt.timer_started_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM active_timers at 
    WHERE at.ticket_id = rt.id
  )
ON CONFLICT DO NOTHING;

-- Clear the old timer_started_at column since we're using active_timers table now
UPDATE repair_tickets SET timer_started_at = NULL WHERE timer_started_at IS NOT NULL;