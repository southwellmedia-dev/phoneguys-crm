# Session: Appointment Submission Fixes
**Date:** January 10, 2025
**Focus:** Fix website form appointment submission errors and complete the customer → device → appointment chain

## Issues Identified and Fixed

### 1. Database Trigger Error
**Problem:** The `notify_on_appointment_created()` trigger function was querying `users.is_active` column which doesn't exist in the users table.

**Error Message:**
```
Failed to create appointments: column "is_active" does not exist
```

**Solution:** Updated the trigger function to remove the `is_active` check:
```sql
-- Migration: fix_appointment_notification_trigger
CREATE OR REPLACE FUNCTION notify_on_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
    v_admin RECORD;
BEGIN
    -- Notify all admins and staff about new appointment
    -- Removed is_active check since users table doesn't have this column
    FOR v_admin IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'staff')
    LOOP
        -- notification logic
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Form Submission Repository Error
**Problem:** The `FormSubmissionRepository` was trying to update `updated_at` field which doesn't exist in the `form_submissions` table.

**Error Message:**
```
Failed to update form_submissions: Could not find the 'updated_at' column of 'form_submissions' in the schema cache
```

**Solution:** Modified the repository to use `processed_at` instead:
```typescript
// lib/repositories/form-submission.repository.ts
async updateStatus(id: string, status: string, appointmentId?: string): Promise<FormSubmission | null> {
  const updateData: FormSubmissionUpdate = {
    status,
    processed_at: new Date().toISOString() // Changed from updated_at
  };
  // ...
}
```

### 3. Time Format Mismatch
**Problem:** The form was sending time in `HH:MM:SS` format (from database slots) but the API validation expected `HH:MM` format.

**Error Message:**
```
Validation failed: appointmentTime must match regex /^\d{2}:\d{2}$/
```

**Solutions Implemented:**
- Updated API validation to accept both formats
- Added time normalization in the API endpoint
- Updated availability service to handle both formats for comparison

```typescript
// app/api/public/appointments/route.ts
appointmentTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // Accept both HH:MM and HH:MM:SS

// Normalize time format
const normalizedTime = data.appointmentTime.includes(':') && data.appointmentTime.split(':').length === 3
  ? data.appointmentTime.substring(0, 5) // Convert HH:MM:SS to HH:MM
  : data.appointmentTime;
```

### 4. Device Condition Validation
**Problem:** The condition value was case-sensitive and "Good" (capital G) was being rejected.

**Error Message:**
```
Failed to create customer_devices: new row for relation "customer_devices" violates check constraint "customer_devices_condition_check"
```

**Solution:** Ensured lowercase values are used ('excellent', 'good', 'fair', 'poor', 'broken')

### 5. Missing FormSubmissionRepository
**Problem:** The repository didn't exist, causing the API to fail when trying to track form submissions.

**Solution:** Created complete `FormSubmissionRepository` class:
```typescript
// lib/repositories/form-submission.repository.ts
export class FormSubmissionRepository extends BaseRepository<FormSubmission> {
  // Implementation for tracking form submissions
}
```

## Complete Appointment Creation Flow

The API now successfully:
1. **Creates or finds customer** - Checks by email, creates if new
2. **Creates customer device** - Links device to customer with specifications
3. **Creates appointment** - With proper scheduling and slot reservation
4. **Tracks form submission** - Records submission and marks as processed
5. **Reserves time slot** - Updates appointment_slots table
6. **Creates notifications** - Notifies admins/staff of new appointment

## Files Modified

### New Files Created
- `lib/repositories/form-submission.repository.ts` - Repository for form submission tracking

### Files Modified
- `app/api/public/appointments/route.ts` - Fixed time format handling, added complete chain creation
- `lib/repositories/repository-manager.ts` - Added FormSubmissionRepository
- `lib/services/availability.service.ts` - Added time format normalization
- `components/premium/connected/dashboard/recent-activity-live.tsx` - Fixed hydration mismatch

### Database Migrations
- `fix_appointment_notification_trigger` - Fixed trigger function removing is_active check

## Testing Results

Successfully created appointment with complete chain:
```json
{
  "success": true,
  "data": {
    "appointmentId": "1f5a82be-f45e-45da-aaec-a4469d114a12",
    "appointmentNumber": "APT0002",
    "status": "scheduled",
    "scheduledDate": "2025-09-12",
    "scheduledTime": "10:00:00"
  }
}
```

Verified in database:
- ✅ Customer created
- ✅ Customer device created with serial number
- ✅ Device linked (iPhone 15 Pro Max)
- ✅ Appointment scheduled
- ✅ Form submission tracked and processed
- ✅ Time slot reserved

## MCP Supabase Tool Setup

Added Supabase MCP tool for direct database access:
- Configuration in `.mcp.json`
- Enabled direct SQL queries for debugging
- Used to identify trigger and column issues

## Key Learnings

1. **Always verify database schema** - Column existence issues can be hidden in triggers
2. **Time format consistency** - Ensure APIs handle multiple time formats when working with database time fields
3. **Repository pattern benefits** - Centralized data access made fixes easier
4. **MCP tools are powerful** - Direct database access via MCP significantly sped up debugging

## Next Steps

- Monitor form submissions for any edge cases
- Consider adding more robust error logging
- Update API documentation with supported time formats
- Consider adding integration tests for the complete appointment creation flow