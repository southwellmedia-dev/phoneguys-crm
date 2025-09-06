# React Query + Supabase Realtime Migration Guide

> A comprehensive guide for correctly implementing React Query with Supabase Realtime for live, collaborative applications

## Table of Contents
1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Core Principles](#core-principles)
4. [Implementation Pattern](#implementation-pattern)
5. [CRUD Operations](#crud-operations)
6. [Migration Steps](#migration-steps)
7. [Testing Checklist](#testing-checklist)
8. [Common Pitfalls](#common-pitfalls)

---

## The Problem

When React Query and Supabase Realtime are incorrectly combined, you get:
- **Blank screens** during data updates (invalidation causes refetch)
- **Race conditions** between optimistic updates and real-time events
- **Complex workarounds** that become unmaintainable
- **Poor user experience** with flickering UI

### Why This Happens
```typescript
// ❌ WRONG: Real-time triggers invalidation
supabase.channel('tickets').on('postgres_changes', {}, (payload) => {
  // This causes React Query to refetch, showing loading state
  queryClient.invalidateQueries(['tickets']);
});
```

---

## The Solution

Use React Query and Supabase Realtime as complementary systems:
- **React Query**: Manages caching, loading states, and optimistic updates
- **Supabase Realtime**: Updates the cache directly without refetching

### The Correct Pattern
```typescript
// ✅ CORRECT: Real-time updates cache directly
supabase.channel('tickets').on('postgres_changes', {}, (payload) => {
  // Update cache without refetching
  queryClient.setQueryData(['tickets'], (old) => {
    // Apply the change to existing data
  });
});
```

---

## Core Principles

### 1. Never Invalidate on Real-time Updates
Invalidation causes refetching which leads to loading states and blank screens.

### 2. Update Cache Directly
Use `setQueryData` to surgically update the cache with real-time changes.

### 3. Optimistic Updates for User Actions
Provide instant feedback for the user's own actions, with rollback on error.

### 4. Smart Subscription Management
Subscribe to specific events and tables, filter when possible, and always clean up.

---

## Implementation Pattern

### Complete Hook Example

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Correct implementation of React Query + Supabase Realtime
 */
export function useDataWithRealtime(filters?: any, initialData?: any[]) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  
  // 1. React Query for data fetching and caching
  const query = useQuery({
    queryKey: ['data', filters],
    queryFn: () => fetchData(filters),
    initialData,
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });
  
  // 2. Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('data-changes')
      // INSERT: Add new item to cache
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'your_table' },
        async (payload) => {
          // Fetch full data with relationships if needed
          const fullData = await fetchFullItem(payload.new.id);
          
          // Update cache directly
          queryClient.setQueryData(['data', filters], (old = []) => {
            // Prevent duplicates
            if (old.find(item => item.id === fullData.id)) return old;
            return [fullData, ...old];
          });
        }
      )
      // UPDATE: Modify existing item in cache
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'your_table' },
        (payload) => {
          queryClient.setQueryData(['data', filters], (old = []) => {
            return old.map(item => 
              item.id === payload.new.id 
                ? { ...item, ...payload.new }
                : item
            );
          });
        }
      )
      // DELETE: Remove item from cache
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'your_table' },
        (payload) => {
          queryClient.setQueryData(['data', filters], (old = []) => {
            return old.filter(item => item.id !== payload.old.id);
          });
        }
      )
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, filters]);
  
  return query;
}

/**
 * Mutation with optimistic updates
 */
export function useUpdateData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['data']);
      
      const previousData = queryClient.getQueryData(['data']);
      
      queryClient.setQueryData(['data'], (old = []) => {
        return old.map(item => 
          item.id === newData.id ? { ...item, ...newData } : item
        );
      });
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['data'], context.previousData);
      }
    },
    
    // Update with server response
    onSuccess: (response) => {
      // Update cache with server data if needed
      if (response.data) {
        queryClient.setQueryData(['data'], (old = []) => {
          return old.map(item => 
            item.id === response.data.id ? response.data : item
          );
        });
      }
    },
  });
}
```

---

## CRUD Operations

### Overview
CRUD operations (Create, Read, Update, Delete) need special handling when working with React Query and Supabase Realtime to ensure data consistency across the application.

### Key Principles for CRUD

1. **Use Mutations with Optimistic Updates**
2. **Let Real-time Handle Remote Changes**
3. **Properly Structure Data for Updates**
4. **Handle Nested Relationships**

### Create Operations

```typescript
// ✅ CORRECT: Create with optimistic update
const createMutation = useMutation({
  mutationFn: async (newItem) => {
    const response = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(newItem),
    });
    return response.json();
  },
  onMutate: async (newItem) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['items']);
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    queryClient.setQueryData(['items'], (old = []) => [
      ...old,
      { ...newItem, id: tempId, isOptimistic: true }
    ]);
    
    return { tempId };
  },
  onSuccess: (data, variables, context) => {
    // Real-time will handle the actual update
    // Remove optimistic item
    queryClient.setQueryData(['items'], (old = []) => 
      old.filter(item => item.id !== context.tempId)
    );
  },
  onError: (error, variables, context) => {
    // Rollback optimistic update
    queryClient.setQueryData(['items'], (old = []) => 
      old.filter(item => item.id !== context.tempId)
    );
  }
});
```

### Read Operations with Relationships

```typescript
// For complex items with relationships (like tickets with services)
async function getItemWithDetails(itemId: string) {
  const { data } = await supabase
    .from('items')
    .select(`
      *,
      related_items (
        id,
        name,
        nested_relation (*)
      )
    `)
    .eq('id', itemId)
    .single();
  
  return data;
}

// Hook for reading with real-time updates
export function useItemDetails(itemId: string) {
  const query = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => getItemWithDetails(itemId),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`item-${itemId}`)
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `id=eq.${itemId}`
        },
        async (payload) => {
          // Fetch full data with relationships
          const fullData = await getItemWithDetails(itemId);
          queryClient.setQueryData(['item', itemId], fullData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  return query;
}
```

### Update Operations with Nested Data

```typescript
// Example: Updating ticket with services
const updateMutation = useMutation({
  mutationFn: async ({ ticketId, updates, selectedServices }) => {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updates,
        selected_services: selectedServices, // Handle nested updates
      }),
    });
    return response.json();
  },
  onMutate: async ({ ticketId, updates, selectedServices }) => {
    // Optimistic update for main item
    await queryClient.cancelQueries(['tickets']);
    
    const previousData = queryClient.getQueryData(['tickets']);
    
    queryClient.setQueryData(['tickets'], (old = []) => 
      old.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              ...updates,
              // Map services for optimistic display
              ticket_services: selectedServices?.map(serviceId => ({
                service_id: serviceId,
                service: { id: serviceId } // Minimal structure for display
              }))
            }
          : ticket
      )
    );
    
    return { previousData };
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tickets'], context.previousData);
  }
});
```

### Delete Operations

```typescript
const deleteMutation = useMutation({
  mutationFn: async (itemId) => {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  onMutate: async (itemId) => {
    await queryClient.cancelQueries(['items']);
    
    const previousData = queryClient.getQueryData(['items']);
    
    // Optimistic removal
    queryClient.setQueryData(['items'], (old = []) => 
      old.filter(item => item.id !== itemId)
    );
    
    return { previousData };
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(['items'], context.previousData);
  }
});
```

### Handling Complex Forms

For edit forms that need to populate with existing data:

```typescript
// 1. Fetch complete data including nested relationships
const { data: order } = await supabase
  .from('repair_tickets')
  .select(`
    *,
    ticket_services (
      id,
      service_id,
      service:services (*)
    )
  `)
  .eq('id', orderId)
  .single();

// 2. Map nested data for form initialization
const EditForm = ({ order }) => {
  // Handle different data structures
  const initialServices = order.ticket_services?.map(ts => 
    ts.service_id || ts.service?.id
  ).filter(Boolean) || [];
  
  const [selectedServices, setSelectedServices] = useState(initialServices);
  
  // ... rest of form logic
};

// 3. Submit with proper data structure
const handleSubmit = async (formData) => {
  await updateMutation.mutateAsync({
    ...formData,
    selected_services: selectedServices, // Include nested updates
  });
};
```

### Best Practices for CRUD with Real-time

1. **Always Include Related Data in Queries**
   ```typescript
   // ❌ Incomplete
   .select('*')
   
   // ✅ Complete with relationships
   .select('*, related_table(*), nested:other_table(*)')
   ```

2. **Handle Data Structure Variations**
   ```typescript
   // Services might come as service_id or nested service.id
   const serviceId = item.service_id || item.service?.id;
   ```

3. **Use Repository Pattern for Complex Operations**
   ```typescript
   class TicketRepository {
     async updateWithDeviceAndServices(ticketId, data) {
       // Handle device creation/update
       // Handle service junction table updates
       // Update main ticket
       // Return complete updated data
     }
   }
   ```

4. **Debug Data Flow**
   ```typescript
   // Add logging during development
   console.log('Form received:', data);
   console.log('Sending to API:', transformedData);
   console.log('API response:', response);
   ```

---

## Migration Steps

### Step 1: Identify Current Issues
Look for these patterns in your code:
- `queryClient.invalidateQueries()` in real-time subscriptions
- Complex "smart invalidation" logic
- Multiple systems fighting over the same data
- Blank screens or loading states during updates

### Step 2: Create New Hook Structure
For each feature, create a hook that combines React Query with Supabase Realtime:

```typescript
// Before: Separate hooks
useTickets() // React Query only
useTicketRealtime() // Supabase subscription that invalidates

// After: Combined hook
useTicketsWithRealtime() // Both working together
```

### Step 3: Update Components
Replace old hooks with new combined hooks:

```typescript
// Before
const { data } = useTickets();
useTicketRealtime(); // Causes invalidation

// After
const { data } = useTicketsWithRealtime(); // Handles both
```

### Step 4: Remove Invalidation Logic
Search for and remove all `invalidateQueries` calls in real-time subscriptions:

```typescript
// Remove this pattern everywhere
.on('postgres_changes', {}, () => {
  queryClient.invalidateQueries(['tickets']); // ❌ Remove
})
```

### Step 5: Implement Direct Cache Updates
Replace invalidation with direct cache updates:

```typescript
.on('postgres_changes', { event: 'UPDATE' }, (payload) => {
  queryClient.setQueryData(['tickets'], (old) => {
    // Update the specific item
    return old.map(ticket => 
      ticket.id === payload.new.id 
        ? { ...ticket, ...payload.new }
        : ticket
    );
  });
})
```

---

## Testing Checklist

### Single User Testing
- [ ] Create item - appears immediately without loading
- [ ] Update item - changes instantly without flicker
- [ ] Delete item - removes without blank screen
- [ ] Timer operations - no data loss during updates
- [ ] Status changes - immediate UI feedback

### Multi-User Testing
Open two browser windows and test:
- [ ] User A creates item → User B sees it appear
- [ ] User A updates item → User B sees changes
- [ ] User A deletes item → User B sees it disappear
- [ ] No interference between users' actions
- [ ] Both users can work simultaneously

### Error Recovery Testing
- [ ] Network failure during update - UI rolls back
- [ ] Server error - User sees error message
- [ ] Optimistic update reverts on failure
- [ ] Can retry failed operations

### Performance Testing
- [ ] No unnecessary refetches in Network tab
- [ ] Smooth UI without flickers
- [ ] Fast initial page load
- [ ] Minimal API calls

---

## Common Pitfalls

### 1. Mixing Patterns
Don't use both invalidation and direct updates:
```typescript
// ❌ WRONG: Don't mix approaches
queryClient.setQueryData(['tickets'], newData);
queryClient.invalidateQueries(['tickets']); // This undoes the setQueryData!
```

### 2. Forgetting Cleanup
Always clean up subscriptions:
```typescript
useEffect(() => {
  const channel = supabase.channel('...');
  // ...
  return () => {
    supabase.removeChannel(channel); // ✅ Important!
  };
}, []);
```

### 3. Not Handling Relationships
When inserting new items, fetch full data with relationships:
```typescript
.on('postgres_changes', { event: 'INSERT' }, async (payload) => {
  // ❌ Incomplete data
  queryClient.setQueryData(['items'], old => [...old, payload.new]);
  
  // ✅ Full data with relationships
  const fullItem = await fetchItemWithRelations(payload.new.id);
  queryClient.setQueryData(['items'], old => [...old, fullItem]);
})
```

### 4. Ignoring Filter Context
Remember that queries can have different filters:
```typescript
// Update all query variations
queryClient.setQueriesData(
  { queryKey: ['tickets'], exact: false }, // Matches all ticket queries
  (old) => updateFunction(old)
);
```

---

## Advanced Patterns

### Handling High-Frequency Updates
For timer updates or other high-frequency changes:

```typescript
// Batch updates to prevent UI thrashing
const batchedUpdates = useMemo(() => 
  debounce((updates) => {
    queryClient.setQueryData(['data'], (old) => 
      applyBatchedUpdates(old, updates)
    );
  }, 100),
  [queryClient]
);
```

### Selective Subscriptions
Subscribe only to relevant data:

```typescript
// Subscribe to specific record
.on('postgres_changes', 
  { 
    event: 'UPDATE',
    schema: 'public',
    table: 'tickets',
    filter: `id=eq.${ticketId}` // Only this ticket
  },
  handleUpdate
)
```

### Cross-Entity Updates
Handle cascading changes:

```typescript
// When customer is deleted, also update appointments
.on('postgres_changes', 
  { event: 'DELETE', table: 'customers' },
  (payload) => {
    // Update customers cache
    queryClient.setQueryData(['customers'], ...);
    
    // Also update related appointments
    queryClient.setQueryData(['appointments'], (old) =>
      old.filter(apt => apt.customer_id !== payload.old.id)
    );
  }
)
```

---

## Migration Checklist for The Phone Guys CRM

### Orders Feature ✅
- [x] Create `useTicketsWithRealtime` hook
- [x] Update `orders-client.tsx` to use new hook
- [x] Update `order-detail-client.tsx` to use new hook
- [x] Remove old invalidation logic
- [x] Test timer operations without blank screen

### Appointments Feature ⏳
- [ ] Create `useAppointmentsWithRealtime` hook
- [ ] Update appointments list component
- [ ] Update appointment detail component
- [ ] Handle status changes with optimistic updates
- [ ] Test multi-user scenarios

### Customers Feature ⏳
- [ ] Create `useCustomersWithRealtime` hook
- [ ] Update customers list component
- [ ] Update customer detail component
- [ ] Handle device management updates
- [ ] Test cascade deletes

### Dashboard ⏳
- [ ] Create `useDashboardWithRealtime` hook
- [ ] Update stats to reflect real-time changes
- [ ] Optimize for performance (batch updates)
- [ ] Test with multiple active users

---

## Conclusion

The key to successfully combining React Query with Supabase Realtime is understanding their complementary roles:

- **React Query** = State Management + Caching + Optimistic Updates
- **Supabase Realtime** = Live Data Sync via Direct Cache Updates
- **Never** = Invalidate queries on real-time events

This pattern provides:
- ✅ Real-time collaborative features
- ✅ Optimistic updates for instant feedback
- ✅ No blank screens or loading states
- ✅ Clean, maintainable code
- ✅ Excellent user experience

Remember: The cache is your single source of truth. Update it directly, don't invalidate and refetch.