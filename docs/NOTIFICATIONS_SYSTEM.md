h# Internal Notifications System Documentation

## Overview
The Phone Guys CRM has a comprehensive internal notification system that keeps users informed about important events in real-time. Notifications appear in the header bell icon and update instantly across all connected clients.

## Architecture

### Components
1. **Database Table**: `internal_notifications`
2. **Repository**: `InternalNotificationRepository` - Database operations
3. **Service**: `InternalNotificationService` - Business logic & notification creation
4. **Hook**: `useInternalNotifications` - React Query hook with real-time subscriptions
5. **UI Component**: `NotificationDropdown` - Premium dropdown component in header
6. **API Routes**: Various endpoints for CRUD operations

### Data Flow
```
Event Occurs → Service Creates Notification → Database Insert 
    ↓
Real-time Subscription → Update React Query Cache → UI Updates
```

## Current Notification Triggers

### 1. New Appointments
**When**: Customer submits appointment through public form
**Who Gets Notified**: All admins and managers
**Trigger Location**: `/app/api/public/appointments/route.ts`
**Message**: "New Appointment Scheduled - {customer_name} has scheduled an appointment for {date} at {time}"
**Priority**: High
**Action**: Links to appointment details

### 2. Ticket Assignment
**When**: Ticket is assigned to a technician
**Who Gets Notified**: The assigned technician
**Trigger Location**: `/app/api/orders/[id]/assign/route.ts`
**Message**: "New Ticket Assigned - Ticket #{ticket_number} for {customer_name} ({device}) has been assigned to you"
**Priority**: High
**Action**: Links to ticket details

### 3. Ticket Status Changes
**When**: Ticket status is updated
**Who Gets Notified**: 
- Assigned technician (if different from person making change)
- All admins/managers (for completed or on-hold tickets)
**Trigger Location**: `/app/api/orders/[id]/status/route.ts`
**Messages**:
- "Ticket Status Update - Ticket #{number} for {customer} is now {status}"
- Special messages for completed/on-hold status
**Priority**: Medium for completed, Low for other changes
**Action**: Links to ticket details

## Notification Types (Enum)

```typescript
enum InternalNotificationType {
  NEW_APPOINTMENT = 'new_appointment',
  APPOINTMENT_ASSIGNED = 'appointment_assigned',
  APPOINTMENT_STATUS_CHANGE = 'appointment_status_change',
  NEW_TICKET = 'new_ticket',
  TICKET_ASSIGNED = 'ticket_assigned',
  TICKET_STATUS_CHANGE = 'ticket_status_change',
  TICKET_COMPLETED = 'ticket_completed',
  TICKET_ON_HOLD = 'ticket_on_hold',
  USER_MENTION = 'user_mention',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom'
}
```

## Priority Levels

```typescript
enum InternalNotificationPriority {
  LOW = 'low',       // Blue info icon
  MEDIUM = 'medium', // Yellow warning icon
  HIGH = 'high',     // Red alert icon
  URGENT = 'urgent'  // Red alert icon
}
```

## How to Add New Notification Triggers

### 1. In an API Endpoint
```typescript
import { InternalNotificationService } from '@/lib/services/internal-notification.service';

// In your API route handler:
const notificationService = new InternalNotificationService(true); // Use service role

// Single user notification
await notificationService.createNotification({
  user_id: targetUserId,
  type: InternalNotificationType.YOUR_TYPE,
  title: 'Notification Title',
  message: 'Detailed message about what happened',
  priority: InternalNotificationPriority.MEDIUM,
  action_url: '/path/to/relevant/page', // Optional
  data: { additional_data: 'any' },     // Optional metadata
  created_by: currentUserId              // Who triggered this
});

// Notify all users with a role
await notificationService.notifyUsersByRole('admin', {
  type: InternalNotificationType.SYSTEM_ALERT,
  title: 'System Alert',
  message: 'Something important happened',
  priority: InternalNotificationPriority.HIGH
});
```

### 2. Using Pre-built Methods
The service includes convenient methods for common scenarios:

```typescript
// New appointment
await notificationService.notifyNewAppointment(
  appointmentId, customerName, appointmentDate, createdBy
);

// Ticket assignment
await notificationService.notifyTicketAssignment(
  ticketId, ticketNumber, assignedUserId, customerName, deviceInfo, assignedBy
);

// Status change
await notificationService.notifyTicketStatusChange(
  ticketId, ticketNumber, userId, newStatus, customerName, changedBy
);
```

## UI Features

### Notification Badge
- Shows count of unread notifications (max display: 9+)
- Red badge with white text
- Animated ping effect for visibility
- Smaller size to not obscure bell icon

### Dropdown Features
- **Unread Highlighting**: Cyan left border and background tint
- **Priority Icons**: Color-coded icons (red/yellow/blue)
- **Time Display**: "2 hours ago" format
- **Mark as Read**: Click notification to mark as read
- **Mark All Read**: Button to clear all at once
- **Action URLs**: Click to navigate to relevant page
- **Real-time Updates**: Instant updates without refresh
- **Smooth Animations**: Professional transitions

### Hover States
- Unread: Light cyan background on hover
- Read: Standard accent color on hover
- No conflicting colors or poor contrast

## Real-time Behavior

1. **Instant Updates**: New notifications appear immediately
2. **Sound Alert**: Plays notification sound for new notifications (optional)
3. **Toast Notifications**: Shows toast popup for new notifications
4. **Cross-tab Sync**: Updates across all browser tabs
5. **Optimistic Updates**: Immediate UI feedback for actions

## Database Schema

```sql
CREATE TABLE internal_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  action_url VARCHAR(500),
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

## Permissions & Security

- Users can only see their own notifications (RLS enforced)
- Service role required for creating notifications for other users
- Notifications are user-specific and isolated
- No cross-user data leakage

## Future Enhancements

Potential additions to the notification system:

1. **More Triggers**:
   - Customer messages/notes
   - Invoice generation
   - Payment received
   - Part arrival
   - Timer start/stop
   - User mentions in notes

2. **Features**:
   - Notification preferences/settings
   - Email digest of unread notifications
   - Push notifications (browser/mobile)
   - Notification categories/filtering
   - Bulk actions on notifications
   - Notification templates
   - Scheduled notifications

3. **Analytics**:
   - Notification engagement metrics
   - Most common notification types
   - Response time tracking

## Testing

To test the notification system:

1. **Create a test appointment** through the public form
2. **Assign a ticket** to another user
3. **Change ticket status** to completed/on-hold
4. **Open multiple browser tabs** to see real-time sync
5. **Check different user roles** for role-based notifications

## Maintenance

- **Cleanup**: Old read notifications are automatically cleaned up after 30 days
- **Performance**: Notifications are indexed by user_id and created_at
- **Monitoring**: Check for failed notification creation in logs