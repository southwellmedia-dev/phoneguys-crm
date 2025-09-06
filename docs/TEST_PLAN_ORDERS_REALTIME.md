# Test Plan: Orders Feature with React Query + Realtime

## Setup
1. Start the development server: `npm run dev`
2. Open two browser windows (to test multi-user scenarios)
3. Log in as different users in each window
4. Navigate to `/orders` in both windows

## Test Scenarios

### 1. Timer Operations (Critical Test)
**Goal**: Ensure no blank screen when starting/stopping timer

#### Test Steps:
1. In Window A: Navigate to a ticket detail page
2. In Window A: Click "Start Timer"
3. **Verify**: 
   - ✅ Timer starts immediately
   - ✅ No blank screen or loading state
   - ✅ Page data remains visible
   - ✅ Timer UI updates to show running state

4. In Window B: Navigate to the same ticket
5. **Verify**:
   - ✅ Window B shows timer is running
   - ✅ Both windows stay in sync

6. In Window A: Click "Stop Timer" and add notes
7. **Verify**:
   - ✅ Timer stops immediately
   - ✅ No blank screen
   - ✅ Time entry appears in list
   - ✅ Window B updates to show timer stopped

### 2. Status Changes
**Goal**: Test optimistic updates and real-time sync

#### Test Steps:
1. In Window A: Open a ticket detail
2. In Window A: Change status from "New" to "In Progress"
3. **Verify**:
   - ✅ Status updates immediately in Window A
   - ✅ No loading spinner on the ticket data
   - ✅ Toast notification appears

4. **Verify in Window B**:
   - ✅ Status updates within 1-2 seconds
   - ✅ No page refresh needed
   - ✅ List view reflects new status

### 3. Create New Ticket
**Goal**: Test real-time insertion

#### Test Steps:
1. In Window A: Click "New Ticket"
2. In Window A: Fill form and submit
3. **Verify**:
   - ✅ Redirects to new ticket immediately
   - ✅ New ticket appears in Window A's list

4. **Verify in Window B**:
   - ✅ New ticket appears at top of list
   - ✅ No refresh needed
   - ✅ Stats update to show new total

### 4. Delete Ticket
**Goal**: Test real-time deletion

#### Test Steps:
1. In Window A: Open a ticket detail
2. In Window A: Click "Delete Ticket"
3. In Window A: Confirm deletion
4. **Verify**:
   - ✅ Redirects to orders list
   - ✅ Ticket removed from list

5. **Verify in Window B**:
   - ✅ Ticket disappears from list
   - ✅ If viewing same ticket, shows "not found"
   - ✅ Stats update to reflect deletion

### 5. Concurrent Editing
**Goal**: Test multiple users working simultaneously

#### Test Steps:
1. Both windows: Open different tickets
2. Window A: Start timer on Ticket 1
3. Window B: Change status on Ticket 2
4. Window A: Add note to Ticket 1
5. Window B: Stop timer on Ticket 2
6. **Verify**:
   - ✅ All operations complete without interference
   - ✅ No blank screens in either window
   - ✅ Changes propagate to the other window

### 6. Network Failure Recovery
**Goal**: Test error handling and rollback

#### Test Steps:
1. Open Chrome DevTools → Network tab
2. Start a timer on a ticket
3. Set network to "Offline"
4. Try to stop the timer
5. **Verify**:
   - ✅ UI shows timer stopped (optimistic)
   - ✅ Error toast appears
   - ✅ Timer reverts to running state
   
6. Set network back to "Online"
7. Try to stop timer again
8. **Verify**:
   - ✅ Operation succeeds
   - ✅ UI updates correctly

## Performance Checks

### Network Tab Analysis
1. Open Chrome DevTools → Network tab
2. Perform various operations
3. **Verify**:
   - ✅ No unnecessary API calls during timer operations
   - ✅ No repeated fetches for the same data
   - ✅ WebSocket connection stays active
   - ✅ Only essential API calls are made

### UI Smoothness
1. Rapidly start/stop timer multiple times
2. **Verify**:
   - ✅ UI remains responsive
   - ✅ No flickering or jumping
   - ✅ Animations remain smooth

## Success Criteria

All tests pass if:
- ✅ **Zero blank screens** during any operation
- ✅ **Instant UI updates** for user's own actions
- ✅ **Real-time sync** between multiple users (within 2 seconds)
- ✅ **Graceful error handling** with proper rollback
- ✅ **Minimal API calls** (check Network tab)
- ✅ **Smooth UI** without flickers or loading states

## Known Good Behavior

With the correct implementation:
- Timer updates show immediately without data loss
- Status changes are instant with optimistic updates
- Real-time updates from other users appear smoothly
- The cache stays in sync across all operations
- Network failures are handled gracefully

## Red Flags (Signs of Problems)

Watch out for:
- 🚫 Page goes blank when starting/stopping timer
- 🚫 "Loading..." text appears during updates
- 🚫 Data disappears and reappears
- 🚫 Multiple API calls for the same operation
- 🚫 UI flickers or jumps during updates
- 🚫 Changes don't propagate to other users
- 🚫 Stale data after operations

---

## Quick Smoke Test (2 minutes)

For a quick validation:
1. Open a ticket detail page
2. Start the timer → **Should be instant, no blank screen**
3. Stop the timer → **Should be instant, no blank screen**
4. Change status → **Should be instant with toast**
5. Check another browser → **Should see all changes**

If all of these work without issues, the implementation is correct!