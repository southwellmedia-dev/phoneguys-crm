# Testing Assignment Notifications Real-time Updates

## Overview
This guide helps you test that real-time notifications are working for ticket and appointment assignments, unassignments, and transfers.

## Test Endpoint
We've created a test endpoint at `/api/test/assignment-notifications` to simulate various notification scenarios.

## Testing Steps

### 1. Get Your User ID
First, you need your current user's ID. You can find this by:
1. Opening browser DevTools (F12)
2. Going to Application > Local Storage > localhost:3000
3. Looking for `sb-egotypldqzdzjclikmeg-auth-token` and copying the user ID from the decoded token

Or run this in the browser console:
```javascript
// Get current user ID from Supabase
const { data: { user } } = await window.supabase.auth.getUser();
console.log('Your User ID:', user.id);
```

### 2. Test Different Scenarios

Open a new terminal or use a tool like Postman/Insomnia to test these scenarios:

#### Test Ticket Assignment
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "ticket-assign",
    "userId": "YOUR_USER_ID"
  }'
```

#### Test Ticket Unassignment
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "ticket-unassign",
    "userId": "YOUR_USER_ID"
  }'
```

#### Test Ticket Transfer (requires two user IDs)
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "ticket-transfer",
    "previousUserId": "PREVIOUS_USER_ID",
    "newUserId": "NEW_USER_ID"
  }'
```

#### Test Appointment Assignment
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "appointment-assign",
    "userId": "YOUR_USER_ID"
  }'
```

#### Test Appointment Unassignment
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "appointment-unassign",
    "userId": "YOUR_USER_ID"
  }'
```

#### Test Appointment Transfer
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "appointment-transfer",
    "previousUserId": "PREVIOUS_USER_ID",
    "newUserId": "NEW_USER_ID"
  }'
```

#### List All Recent Notifications
```bash
curl -X POST http://localhost:3000/api/test/assignment-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "list-all",
    "userId": "YOUR_USER_ID"
  }'
```

### 3. Verify Real-time Updates

After sending a test notification:

1. **Check the bell icon** in the header - it should update immediately without refreshing
2. **Check the badge count** - should increment in real-time
3. **Click the bell** - the notification should appear in the dropdown
4. **Check browser console** - look for these logs:
   - `🔌 Setting up real-time subscription`
   - `📡 Subscription status: SUBSCRIBED`
   - `🔔 Real-time INSERT received`
   - `📝 Found X queries to update`

### 4. Test with Actual Assignments

#### For Tickets:
1. Go to the Orders page (`/orders`)
2. Click on any ticket
3. Change the "Assigned To" field
4. The assigned user should receive a notification immediately

#### For Appointments:
1. Go to the Appointments page (`/appointments`)
2. Click on any appointment
3. Change the "Assigned To" field
4. The assigned user should receive a notification immediately

## Troubleshooting

### Notifications not appearing in real-time?

1. **Check browser console for errors**
2. **Verify subscription is active**:
   ```javascript
   // Run in browser console
   const channels = window.supabase.getChannels();
   console.log('Active channels:', channels);
   ```

3. **Check if notifications are being created**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM internal_notifications 
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Ensure real-time is enabled for the table**:
   - Go to Supabase Dashboard > Database > Replication
   - Ensure `internal_notifications` table has real-time enabled

## Expected Behavior

✅ **Working correctly when:**
- Bell icon badge updates immediately
- Notifications appear without page refresh
- Toast notifications show for new notifications
- Multiple tabs/windows update simultaneously

❌ **Not working when:**
- Must refresh page to see new notifications
- Badge count doesn't update
- Console shows subscription errors
- Notifications appear in database but not UI

## Console Logs for Debugging

The system includes helpful console logs:
- `🔌 Setting up real-time subscription` - Subscription initialization
- `📡 Subscription status` - Confirms SUBSCRIBED state
- `🔔 Real-time INSERT received` - Event received from Supabase
- `📝 Found queries to update` - Cache update process
- `✅ Notification created` - Notification successfully added to cache

## API Response Examples

### Successful Assignment Notification
```json
{
  "success": true,
  "scenario": "ticket-assign",
  "result": {
    "notification": {
      "id": "uuid",
      "user_id": "user-uuid",
      "type": "ticket_assigned",
      "title": "Ticket for Test Customer",
      "message": "iPhone 15 Pro repair - Ticket #TEST-001",
      "created_at": "2025-01-11T..."
    }
  },
  "message": "Test notification for 'ticket-assign' created successfully. Check the bell icon in the header for real-time update."
}
```

## Notes

- Notifications are user-specific (you only see your own)
- Unread notifications persist across sessions
- Read notifications are marked when clicked
- System automatically handles duplicate prevention
- All assignment changes trigger appropriate notifications