-- Seed data for The Phone Guys CRM
-- This file creates sample data for local development

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE ticket_notes CASCADE;
TRUNCATE TABLE time_entries CASCADE;
TRUNCATE TABLE repair_tickets CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE users CASCADE;

-- Insert sample users (staff)
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@phoneguys.com', 'John Admin', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'tech1@phoneguys.com', 'Sarah Technician', 'technician'),
  ('33333333-3333-3333-3333-333333333333', 'tech2@phoneguys.com', 'Mike Repair', 'technician'),
  ('44444444-4444-4444-4444-444444444444', 'manager@phoneguys.com', 'Lisa Manager', 'manager');

-- Insert sample customers
INSERT INTO customers (id, name, email, phone) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Johnson', 'alice.johnson@email.com', '555-0101'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Smith', 'bob.smith@email.com', '555-0102'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Charlie Brown', 'charlie.brown@email.com', '555-0103'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Diana Prince', 'diana.prince@email.com', '555-0104'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Edward Norton', 'edward.norton@email.com', '555-0105'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Fiona Green', 'fiona.green@email.com', '555-0106');

-- Insert sample repair tickets
INSERT INTO repair_tickets (
  id, customer_id, assigned_to, device_brand, device_model, 
  serial_number, imei, repair_issues, description, 
  estimated_cost, status, priority, date_received
) VALUES
  -- New ticket
  ('00000001-0000-0000-0000-000000000001', 
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   NULL,
   'Apple', 'iPhone 14 Pro', 
   'F2LZK9XJKXF8', '353850109074471',
   ARRAY['screen_crack', 'battery_issue'],
   'Customer reports screen is cracked in upper right corner. Battery drains quickly.',
   249.99, 'new', 'high', NOW() - INTERVAL '2 hours'),
   
  -- In Progress ticket
  ('00000002-0000-0000-0000-000000000002',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '22222222-2222-2222-2222-222222222222',
   'Samsung', 'Galaxy S23',
   'R3CR40ABCDE', '356938108542179',
   ARRAY['charging_port'],
   'Charging port not working properly. Phone charges intermittently.',
   89.99, 'in_progress', 'medium', NOW() - INTERVAL '1 day'),
   
  -- On Hold ticket
  ('00000003-0000-0000-0000-000000000003',
   'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '22222222-2222-2222-2222-222222222222',
   'Google', 'Pixel 7',
   'GA03924-US', '358240051111110',
   ARRAY['camera_issue', 'software_issue'],
   'Camera app crashes. Needs parts ordered.',
   159.99, 'on_hold', 'medium', NOW() - INTERVAL '3 days'),
   
  -- Completed ticket
  ('00000004-0000-0000-0000-000000000004',
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   '33333333-3333-3333-3333-333333333333',
   'Apple', 'iPhone 13',
   'G6TZR9XJKXF9', '353850109074472',
   ARRAY['screen_crack'],
   'Screen replacement completed successfully.',
   199.99, 'completed', 'low', NOW() - INTERVAL '5 days'),
   
  -- Urgent new ticket
  ('00000005-0000-0000-0000-000000000005',
   'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   NULL,
   'OnePlus', '11',
   'OP11-12345', '862012050123456',
   ARRAY['water_damage'],
   'Phone fell in water. Not turning on. Customer needs urgent repair for business.',
   299.99, 'new', 'urgent', NOW() - INTERVAL '30 minutes'),
   
  -- Another in-progress ticket
  ('00000006-0000-0000-0000-000000000006',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '33333333-3333-3333-3333-333333333333',
   'Apple', 'iPad Pro 12.9',
   'DMPWK9XJKXF0', NULL,
   ARRAY['screen_crack', 'battery_issue'],
   'iPad screen shattered. Battery also needs replacement.',
   399.99, 'in_progress', 'high', NOW() - INTERVAL '4 hours');

-- Update completed ticket with completion date and actual cost
UPDATE repair_tickets 
SET completed_at = NOW() - INTERVAL '2 days',
    actual_cost = 189.99,
    total_time_minutes = 120
WHERE id = '00000004-0000-0000-0000-000000000004';

-- Insert sample ticket notes
INSERT INTO ticket_notes (ticket_id, user_id, note_type, content, is_important) VALUES
  ('00000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'internal', 
   'Customer called to check status. Informed parts are being ordered.', false),
  ('00000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'customer', 
   'Sent email update to customer about repair timeline.', false),
  ('00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'internal',
   'Diagnosed issue - charging port pins are bent. Starting repair.', true),
  ('00000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'internal',
   'Camera module needs to be ordered. ETA 3-5 business days.', true),
  ('00000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'customer',
   'Called customer to inform about parts delay. Customer agreed to wait.', false),
  ('00000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'internal',
   'Screen replacement completed. Tested all functions - working perfectly.', false),
  ('00000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'internal',
   'URGENT: Business customer. Prioritize this repair.', true);

-- Insert sample time entries
INSERT INTO time_entries (ticket_id, user_id, start_time, end_time, duration_minutes, description) VALUES
  ('00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', 45,
   'Initial diagnosis and disassembly'),
  ('00000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   NOW() - INTERVAL '4 hours', NULL, NULL,
   'Repair in progress'),
  ('00000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '120 minutes', 120,
   'Complete screen replacement'),
  ('00000006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333',
   NOW() - INTERVAL '2 hours', NULL, NULL,
   'Working on iPad repair');

-- Update timer status for in-progress repairs
UPDATE repair_tickets 
SET is_timer_running = true,
    timer_started_at = NOW() - INTERVAL '2 hours',
    total_time_minutes = 45
WHERE id = '00000002-0000-0000-0000-000000000002';

UPDATE repair_tickets 
SET is_timer_running = true,
    timer_started_at = NOW() - INTERVAL '1 hour',
    total_time_minutes = 0
WHERE id = '00000006-0000-0000-0000-000000000006';

-- Insert sample notifications
INSERT INTO notifications (ticket_id, notification_type, recipient_email, subject, content, status, sent_at) VALUES
  ('00000001-0000-0000-0000-000000000001', 'new_ticket', 'admin@phoneguys.com',
   'New Repair Ticket: TPG0001', 
   'A new repair ticket has been created for Alice Johnson - iPhone 14 Pro',
   'sent', NOW() - INTERVAL '2 hours'),
  ('00000004-0000-0000-0000-000000000004', 'completion', 'diana.prince@email.com',
   'Your repair is complete!',
   'Your iPhone 13 repair has been completed. Please visit our store to pick up your device.',
   'sent', NOW() - INTERVAL '2 days'),
  ('00000003-0000-0000-0000-000000000003', 'on_hold', 'charlie.brown@email.com',
   'Repair Status Update: On Hold',
   'Your Pixel 7 repair is currently on hold while we wait for parts. We will update you once parts arrive.',
   'pending', NULL),
  ('00000005-0000-0000-0000-000000000005', 'new_ticket', 'manager@phoneguys.com',
   'URGENT: New Repair Ticket TPG0005',
   'An urgent repair ticket has been created for Edward Norton - OnePlus 11 with water damage.',
   'sent', NOW() - INTERVAL '30 minutes');

-- Create some auth users for testing (these need to be created via Supabase Auth)
-- Note: These are just placeholders - actual auth users need to be created through Supabase Auth
-- You can create them via the Supabase Studio UI at http://127.0.0.1:54323