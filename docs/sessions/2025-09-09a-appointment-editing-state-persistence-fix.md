# Session: Appointment Editing State Persistence Fix

**Date**: January 9, 2025
**Issue**: Appointment editing not saving device and service selections
**Resolution**: Fixed state management issues with React Query and real-time updates

## Problem Description

When editing an appointment:
1. User could select a device and services
2. Console logs showed the selections were being made correctly
3. However, when clicking "Save Changes", the state was empty
4. Data was not persisting to the database

### Symptoms
```javascript
// During editing - state updates correctly
Setting device_id from customer device: eabcc0ae-71dc-491a-b06f-5c81e645568b
New selected services: ['service-1', 'service-2', 'service-3']

// On save - state is empty
Current state before save:
- deviceData: {id: null, ...}
- selectedServices: []
```

## Root Cause Analysis

The issue was caused by multiple interacting factors:

1. **React Query Cache Updates**: Real-time subscriptions were updating the React Query cache, causing component re-renders
2. **Stale Closures**: The save handler was capturing stale state due to React's closure behavior
3. **Component Re-mounting**: The component was being re-instantiated between edits and saves
4. **Improper State Initialization**: State wasn't following our HYDRATION_STRATEGY.md patterns

## Solution Implementation

### 1. Proper React Query Integration
```typescript
// Following FEATURE_DEVELOPMENT_GUIDE.md patterns
const { data: appointment = initialAppointment } = useAppointment(appointmentId, initialAppointment);
```

### 2. State Preservation with Refs
```typescript
// Use refs to ensure we always have current state values
const stateRef = useRef({
  deviceData,
  selectedServices,
  selectedCustomerDeviceId: null as string | null,
  notes: {} as NotesData
});

// Update ref whenever state changes
useEffect(() => {
  stateRef.current.deviceData = deviceData;
}, [deviceData]);

useEffect(() => {
  stateRef.current.selectedServices = selectedServices;
}, [selectedServices]);
```

### 3. Save Handler Using Current State
```typescript
const handleSave = async () => {
  // Use ref to get current state values
  const currentState = stateRef.current;
  
  const formData = {
    device_id: currentState.deviceData.id || null,
    customer_device_id: currentState.selectedCustomerDeviceId || null,
    selected_services: currentState.selectedServices || [],
    // ... other fields
  };
  
  const result = await updateAppointmentDetails(appointmentId, formData);
};
```

### 4. UI Improvements Implemented

#### Changed First Metric Card
- Now shows "Scheduled Date/Time" with both date and time
- Uses `format(new Date(appointment.scheduled_date), 'MMM d, yyyy')` for date
- Shows time in 12-hour format below the date

#### Moved Estimated Cost Card
- Relocated to first position in right sidebar
- Added disabled state when no services selected
- Shows "No estimate available" and "Select services to calculate cost" when empty
- Changes from green to gray styling when disabled

#### Fixed Save Button Styling
- Changed from `variant: "gradient"` to `variant: "gradient-success"` for green color

## Key Learnings

### 1. React Query + Real-time Considerations
- Real-time updates through React Query cache can cause unexpected re-renders
- Must properly manage state across re-renders when using real-time subscriptions

### 2. Following Our Architecture Patterns
- **HYDRATION_STRATEGY.md**: Use proper state initialization with lazy functions
- **FEATURE_DEVELOPMENT_GUIDE.md**: Maintain React Query patterns with real-time
- Don't disable architectural features (like real-time) to fix issues - fix the root cause

### 3. State Management Best Practices
- Use refs when you need guaranteed access to current state in callbacks
- Be aware of React's closure behavior with event handlers
- Initialize state properly using lazy initialization: `useState(() => initialValue)`

## Files Modified

1. `app/(dashboard)/appointments/[id]/appointment-detail-premium.tsx`
   - Fixed state management with refs
   - Improved UI components layout
   - Fixed button styling

2. `app/(dashboard)/appointments/[id]/actions.ts`
   - Added console logging for debugging
   - Verified server-side handling was correct

3. `lib/services/realtime.service.ts`
   - Updated to properly sync all appointment fields in real-time updates

## Testing Checklist

- [x] Device selection persists when saving
- [x] Service selection persists when saving
- [x] Real-time updates continue to work
- [x] No hydration mismatches
- [x] UI shows proper disabled states
- [x] Save button has correct green styling
- [x] Date/time displays correctly in metric card
- [x] Estimated cost updates and shows disabled state properly

## Prevention Strategies

1. **Always follow HYDRATION_STRATEGY.md** when creating data-aware components
2. **Use refs for state that needs to be accessed in callbacks** to avoid stale closures
3. **Test with React StrictMode** to catch re-render issues early
4. **Monitor console logs** during development for unexpected re-renders
5. **Don't bypass architectural patterns** - fix issues within the established framework

## Related Documentation

- [HYDRATION_STRATEGY.md](../components/HYDRATION_STRATEGY.md)
- [FEATURE_DEVELOPMENT_GUIDE.md](../features/FEATURE_DEVELOPMENT_GUIDE.md)
- [DEVELOPER_ONBOARDING.md](../review/DEVELOPER_ONBOARDING.md)