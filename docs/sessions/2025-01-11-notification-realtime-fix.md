# Session: Fix Internal Notifications Real-time Updates

**Date**: January 11, 2025  
**Issue**: Internal notifications were being created successfully but not appearing in real-time in the header bell icon - users had to manually refresh the page to see new notifications  
**Resolution**: Fixed cache key mismatch in React Query and applied missing database migrations

## Problem Summary

The internal notification system was partially working:
- ✅ Notifications were being created in the database
- ✅ Notifications appeared after page refresh
- ❌ Real-time updates were not working
- ❌ Bell icon badge didn't update instantly
- ❌ Some notification types (unassignment) were failing due to database constraints

## Root Causes Identified

### 1. Missing Database Migrations
Three critical migrations from September 11, 2024 had not been applied to production:
- `20250911150526_fix_realtime_notifications_rls.sql` - Fixed RLS policies for real-time
- `20250911151234_enable_notifications_realtime.sql` - Enabled real-time publication
- `20250911152049_update_notification_types.sql` - Added missing notification types

This caused:
- `appointment_unassigned` notifications to fail with constraint violations
- Real-time subscriptions to potentially not work correctly

### 2. React Query Cache Key Mismatch
The main issue preventing real-time updates from appearing:

**The Problem:**
```typescript
// Query key used by the hook
['internal-notifications', userId, { unreadOnly: false, limit: 20 }]

// Cache update attempted in real-time handler
['internal-notifications', userId] // Missing the options object!
```

The real-time subscription was trying to update a cache key that didn't exist because it wasn't including the options object.

**Why This Happened:**
- The `NotificationDropdown` component calls `useInternalNotifications({ limit: 20 })`
- This creates a query key with an options object
- The real-time handler was trying to update without the options
- JavaScript object equality is by reference, so `{ limit: 20 } !== { limit: 20 }`

## Solution Implemented

### 1. Applied Missing Migrations
```bash
npx supabase db push --password "***"
```
This added:
- Support for all notification types (unassigned, transferred, etc.)
- Proper RLS policies for real-time
- Real-time publication enablement

### 2. Fixed Cache Updates
Changed from trying to match exact query keys to updating ALL matching queries:

```typescript
// OLD APPROACH (broken)
queryClient.setQueryData(
  ['internal-notifications', userId, { unreadOnly, limit }],
  updater
);

// NEW APPROACH (working)
const cache = queryClient.getQueryCache();
const queries = cache.findAll({
  queryKey: ['internal-notifications', userId],
  exact: false // Match any query starting with these keys
});

queries.forEach(query => {
  queryClient.setQueryData(query.queryKey, updater);
});
```

This ensures all notification queries get updated regardless of their specific options.

## Technical Details

### Files Modified
- `lib/hooks/use-internal-notifications.ts` - Fixed real-time subscription cache updates
- `supabase/migrations/` - Added three migration files
- Multiple API endpoints and components for the notification system

### Key Changes in use-internal-notifications.ts

1. **For INSERT events**: Finds all queries and prepends new notification
2. **For UPDATE events**: Finds all queries and updates the specific notification
3. **For DELETE events**: Finds all queries and removes the notification
4. **Unread count**: Updates separately with its own key

### Debugging Process

1. Added extensive console logging to track subscription status
2. Verified user IDs matched between auth and notifications
3. Checked RLS policies and table real-time enablement
4. Discovered cache keys weren't matching with console logs
5. Tried multiple approaches:
   - `setQueriesData` with exact match (didn't work)
   - `setQueryData` with exact key (didn't work)
   - `findAll` with partial match (worked!)

## Testing & Verification

### Test Scenarios
1. **Assignment**: User receives notification when appointed assigned to them ✅
2. **Unassignment**: User receives notification when appointment unassigned ✅
3. **Transfer**: Both users receive notifications on transfer ✅
4. **Multiple tabs**: Real-time updates across browser tabs ✅
5. **Bell icon badge**: Updates immediately without refresh ✅
6. **Toast notifications**: Appear for new notifications ✅

### Console Logs for Debugging
The fix includes helpful console logs:
- `🔌 Setting up real-time subscription` - Shows subscription initialization
- `📡 Subscription status` - Confirms SUBSCRIBED state
- `🔔 Real-time INSERT received` - Confirms event received
- `📝 Found queries to update` - Shows cache update process

## Lessons Learned

1. **React Query cache keys are strict**: Objects in keys must be the exact same reference or use partial matching
2. **Database migrations must be applied**: Even if code is deployed, missing migrations break functionality
3. **Real-time debugging approach**: 
   - First verify subscription is connected
   - Then verify events are received
   - Finally verify cache updates work
4. **Use `findAll` for flexible cache updates**: When dealing with dynamic query keys, finding all matching queries is more reliable

## Production Deployment

```bash
# Migrations applied to production
git add -A
git reset HEAD .env.local.development .env.local.production  # Exclude env files
git commit -m "feat: Complete internal notification system with real-time updates"
git push origin main
```

The system is now fully functional with real-time notifications appearing instantly in the header without requiring page refresh.

## Future Improvements

1. Consider using a simpler query key structure without objects
2. Add notification preferences per user
3. Implement notification grouping for similar events
4. Add sound preferences for notifications
5. Clean up old read notifications periodically

## Related Documentation
- [NOTIFICATIONS_SYSTEM.md](../NOTIFICATIONS_SYSTEM.md) - Full system documentation
- [HYDRATION_STRATEGY.md](../components/HYDRATION_STRATEGY.md) - Hydration patterns used
- [FEATURE_DEVELOPMENT_GUIDE.md](../features/FEATURE_DEVELOPMENT_GUIDE.md) - Development patterns followed