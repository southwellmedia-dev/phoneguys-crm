-- Clear All Active Timers
-- Run this in Supabase Studio SQL Editor to clear all active timers

-- First, check which timers are active
SELECT 
  id, 
  ticket_number, 
  timer_is_running,
  timer_started_at,
  assigned_to
FROM repair_tickets 
WHERE timer_is_running = true;

-- Clear all active timers
-- Uncomment the following lines to execute:
/*
UPDATE repair_tickets 
SET 
  timer_is_running = false,
  timer_started_at = null
WHERE timer_is_running = true;
*/

-- To clear a specific timer (replace TICKET_ID with actual ID):
/*
UPDATE repair_tickets 
SET 
  timer_is_running = false,
  timer_started_at = null
WHERE id = 'TICKET_ID';
*/

-- To clear the specific timer mentioned (5ba8359c-8b47-45ad-837f-3c3c5adc5c92):
/*
UPDATE repair_tickets 
SET 
  timer_is_running = false,
  timer_started_at = null
WHERE id = '5ba8359c-8b47-45ad-837f-3c3c5adc5c92';
*/