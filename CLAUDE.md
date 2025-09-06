# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Phone Guys CRM** is a comprehensive repair management system for a mobile device repair service. Built with Next.js 15, TypeScript, Supabase, and TanStack Query, it provides real-time collaboration, efficient order tracking, and seamless customer management.

### Core Features
- **Repair Order Management**: Track repairs from intake to completion with real-time status updates
- **Customer & Device Tracking**: Manage customer profiles and their device history
- **Appointment System**: Schedule and convert appointments to repair tickets
- **Time Tracking & Billing**: Track technician time with automatic billing calculations
- **Admin Dashboard**: Comprehensive admin tools for users, devices, and services
- **External API**: REST endpoints for Astro website integration

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query v5 + Supabase Realtime
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with cookie-based sessions
- **UI Components**: shadcn/ui (New York style) with custom design system

## Architecture & Project Structure

### Folder Structure
```
/app                    # Next.js App Router pages and layouts
  /(dashboard)         # Protected CRM pages
  /admin              # Admin-only pages
  /api                # REST API endpoints
  /auth               # Authentication pages

/components           # React components
  /admin             # Admin-specific components
  /appointments      # Appointment components
  /customers         # Customer management components
  /layout            # Layout components
  /orders            # Order/ticket components
  /ui                # shadcn/ui primitives

/lib                  # Core application logic
  /hooks             # React Query hooks for data fetching
  /repositories      # Database access layer (Supabase client)
  /services          # Business logic layer
  /types             # TypeScript type definitions
  /utils             # Utility functions
  /supabase          # Supabase client configuration

/docs                # Project documentation
/supabase           # Database migrations and seed data
```

### Data Flow Architecture
```
Component → Hook → Service → Repository → Database
    ↑         ↓
    └── React Query Cache ← Realtime Subscription
```

1. **Components** use hooks to fetch/mutate data
2. **Hooks** (React Query) manage caching and state
3. **Services** contain business logic and validation
4. **Repositories** handle direct database operations
5. **Realtime** updates flow directly to React Query cache

## Development Patterns

### Creating a New Feature

#### 1. Repository Layer
```typescript
// lib/repositories/feature.repository.ts
export class FeatureRepository extends BaseRepository {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'table_name');
  }

  async customQuery(params: Params) {
    const query = this.supabase
      .from(this.table)
      .select('*, related_table(*)')
      .eq('status', params.status);
    
    return this.handleResponse(query);
  }
}
```

#### 2. Service Layer
```typescript
// lib/services/feature.service.ts
export class FeatureService {
  constructor(
    private featureRepo: FeatureRepository,
    private relatedRepo: RelatedRepository
  ) {}

  async processFeature(data: FeatureData) {
    // Business logic here
    const processed = this.validateAndTransform(data);
    
    // Use repositories for database operations
    const result = await this.featureRepo.create(processed);
    
    // Handle related operations
    if (result.needsNotification) {
      await this.relatedRepo.notify(result.id);
    }
    
    return result;
  }
}
```

#### 3. React Query Hook
```typescript
// lib/hooks/use-feature.ts
export function useFeature(id?: string) {
  const supabase = createClient();
  
  // Query for fetching data
  const query = useQuery({
    queryKey: ['feature', id],
    queryFn: async () => {
      const repo = new FeatureRepository(supabase);
      return repo.findById(id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id
  });

  // Mutation for updates
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateData) => {
      const service = new FeatureService(repo, otherRepo);
      return service.updateFeature(id, data);
    },
    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries(['feature', id]);
      const previous = queryClient.getQueryData(['feature', id]);
      
      queryClient.setQueryData(['feature', id], old => ({
        ...old,
        ...data
      }));
      
      return { previous };
    },
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['feature', id], context.previous);
      }
    }
  });

  // Real-time subscription
  useRealtime({
    channel: `feature-${id}`,
    table: 'features',
    filter: `id=eq.${id}`,
    onUpdate: (payload) => {
      queryClient.setQueryData(['feature', id], payload.new);
    }
  });

  return { ...query, updateFeature: updateMutation.mutate };
}
```

#### 4. Component Implementation
```typescript
// components/feature/feature-detail.tsx
export function FeatureDetail({ id }: Props) {
  const { data, isLoading, updateFeature } = useFeature(id);
  
  if (isLoading) return <FeatureSkeleton />;
  
  const handleUpdate = (values: FormValues) => {
    updateFeature(values, {
      onSuccess: () => toast.success('Updated successfully'),
      onError: () => toast.error('Update failed')
    });
  };
  
  return <FeatureForm data={data} onSubmit={handleUpdate} />;
}
```

## Critical Guidelines

### ✅ DO

1. **Use setQueryData for real-time updates**
```typescript
// Correct: Direct cache update
queryClient.setQueryData(['tickets'], newData);
```

2. **Handle both array and wrapped responses**
```typescript
queryClient.setQueryData(['customers'], (old: any) => {
  if (Array.isArray(old)) {
    return updateArray(old);
  } else if (old?.data) {
    return { ...old, data: updateArray(old.data) };
  }
  return old;
});
```

3. **Cleanup subscriptions properly**
```typescript
useEffect(() => {
  const channel = supabase.channel('unique-channel');
  // subscribe...
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

4. **Implement optimistic updates with rollback**
```typescript
onMutate: async (data) => {
  await queryClient.cancelQueries(['resource']);
  const previous = queryClient.getQueryData(['resource']);
  queryClient.setQueryData(['resource'], optimisticData);
  return { previous };
},
onError: (err, data, context) => {
  if (context?.previous) {
    queryClient.setQueryData(['resource'], context.previous);
  }
}
```

### ❌ DON'T

1. **Never use router.refresh()**
```typescript
// Wrong: Causes full page reload
router.refresh();

// Correct: Update cache directly
queryClient.setQueryData(['data'], newData);
```

2. **Never invalidate queries in real-time handlers**
```typescript
// Wrong: Causes refetch, breaking real-time flow
onUpdate: () => {
  queryClient.invalidateQueries(['tickets']);
}

// Correct: Update cache directly
onUpdate: (payload) => {
  queryClient.setQueryData(['tickets'], payload.new);
}
```

3. **Never mix setQueryData with invalidateQueries**
```typescript
// Wrong: Invalidate undoes the cache update
queryClient.setQueryData(['tickets'], newData);
queryClient.invalidateQueries(['tickets']); // DON'T DO THIS

// Correct: Only update cache
queryClient.setQueryData(['tickets'], newData);
```

4. **Never use refetch() after mutations**
```typescript
// Wrong: Let real-time handle updates
onSuccess: () => {
  query.refetch();
}

// Correct: Real-time subscription will update cache
onSuccess: () => {
  toast.success('Updated');
}
```

## Commands

### Development
```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build production application
npm start          # Start production server
npm run lint       # Run ESLint
npx tsc --noEmit   # Type-check without emitting files
```

### Supabase Local Development
```bash
npx supabase start  # Start local Supabase services
npx supabase stop   # Stop local Supabase services
npx supabase status # Check status of local services
npx supabase db reset # Reset database with seed data

# Local URLs
# App: http://localhost:3000
# Studio: http://127.0.0.1:54323
# API: http://127.0.0.1:54321
# Inbucket (Email): http://127.0.0.1:54324
```

### Database Management
```bash
# Pull remote schema (be careful with production)
npx supabase db pull --password "your-password"

# Generate types from database
npx supabase gen types typescript --local > lib/types/supabase.ts

# Run migrations
npx supabase migration up
```

## Common Patterns

### Real-time Subscription with React Query
```typescript
import { useRealtime } from '@/lib/hooks/use-realtime';

function useTickets() {
  const { data, ...query } = useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets
  });

  // Subscribe to real-time updates
  useRealtime({
    channel: 'tickets-channel',
    table: 'repair_tickets',
    onInsert: (payload) => {
      queryClient.setQueryData(['tickets'], old => 
        [...(old || []), payload.new]
      );
    },
    onUpdate: (payload) => {
      queryClient.setQueryData(['tickets'], old =>
        old?.map(t => t.id === payload.new.id ? payload.new : t)
      );
    },
    onDelete: (payload) => {
      queryClient.setQueryData(['tickets'], old =>
        old?.filter(t => t.id !== payload.old.id)
      );
    }
  });

  return { data, ...query };
}
```

### Service Layer with Multiple Repositories
```typescript
export class OrderService {
  async createOrder(data: CreateOrderDTO) {
    // Start transaction mindset (though Supabase doesn't support transactions)
    try {
      // Create customer if needed
      let customerId = data.customerId;
      if (!customerId && data.customer) {
        const customer = await this.customerRepo.create(data.customer);
        customerId = customer.id;
      }

      // Create the ticket
      const ticket = await this.ticketRepo.create({
        ...data.ticket,
        customer_id: customerId
      });

      // Create initial note if provided
      if (data.initialNote) {
        await this.noteRepo.create({
          ticket_id: ticket.id,
          content: data.initialNote
        });
      }

      return ticket;
    } catch (error) {
      // Handle errors appropriately
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }
}
```

### Optimistic Updates Pattern
```typescript
const mutation = useMutation({
  mutationFn: updateStatus,
  onMutate: async (newStatus) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['ticket', ticketId]);
    
    // Snapshot current data
    const previous = queryClient.getQueryData(['ticket', ticketId]);
    
    // Optimistically update
    queryClient.setQueryData(['ticket', ticketId], old => ({
      ...old,
      status: newStatus
    }));
    
    // Return context for rollback
    return { previous };
  },
  onError: (err, newStatus, context) => {
    // Rollback on error
    queryClient.setQueryData(['ticket', ticketId], context.previous);
    toast.error('Failed to update status');
  },
  onSuccess: () => {
    toast.success('Status updated');
  }
});
```

## Testing Checklist

Before deploying changes:

- [ ] Test with multiple users for real-time updates
- [ ] Verify optimistic updates and rollback behavior
- [ ] Check subscription cleanup (no memory leaks)
- [ ] Test error states and recovery
- [ ] Verify loading states and skeletons
- [ ] Check responsive design on mobile
- [ ] Test with slow network (throttling)
- [ ] Verify TypeScript types (no `any` types)

## Environment Variables

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# External API (for Astro integration)
API_SECRET_KEY=your-api-secret
```

## Key Services & Hooks

### Core Hooks
- `useTickets()` - Order/ticket management with real-time
- `useCustomers()` - Customer data and devices
- `useAppointments()` - Appointment scheduling
- `useAdmin()` - Admin dashboard data
- `useRealtime()` - Real-time subscription helper

### Singleton Services
- `RealtimeService` - Manages all WebSocket connections
- `AuthorizationService` - Role-based permissions
- `TimerService` - Global timer state management

### Repository Pattern
All database operations go through repositories extending `BaseRepository`:
- `RepairTicketRepository`
- `CustomerRepository`
- `AppointmentRepository`
- `UserRepository`
- etc.

## Important Notes

1. **Performance**: The app has been optimized to eliminate page refreshes. Always use cache updates instead of refetching.

2. **Real-time**: All data updates should flow through Supabase Realtime subscriptions to React Query cache.

3. **TypeScript**: Maintain strict typing. Avoid `any` types unless absolutely necessary.

4. **Error Handling**: Always implement proper error handling with user-friendly messages.

5. **Testing**: Use the seed data for testing. Test user: `admin@phoneguys.com` / `admin123456`

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Start Supabase: `npx supabase start`
4. Copy `.env.local.example` to `.env.local.development`
5. Run development server: `npm run dev`
6. Access app at `http://localhost:3000`

## Where to Find Things

- **Database Schema**: `/supabase/migrations/`
- **Seed Data**: `/supabase/seed.sql`
- **API Routes**: `/app/api/`
- **React Hooks**: `/lib/hooks/`
- **UI Components**: `/components/`
- **Business Logic**: `/lib/services/`
- **Type Definitions**: `/lib/types/`