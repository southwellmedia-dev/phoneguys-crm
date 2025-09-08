# Connected Components Architecture Guide

## 📖 Overview

Connected Components are data-aware versions of our premium UI components that integrate with React Query, Supabase real-time, and the CRM's data layer. They provide seamless real-time updates while maintaining excellent loading states and user experience.

## 🏗️ Architecture Principles

### Core Philosophy
1. **Structure First**: Components render visual structure immediately, no container skeletons
2. **Progressive Enhancement**: Works with SSR, enhances on client-side
3. **Internal Skeletons**: Use contextual loading states within components
4. **Cache-First Updates**: Real-time changes flow through React Query cache
5. **Zero Flash**: No layout shifts or empty states during hydration

### Data Flow
```
Component → Hook → API → Repository → Database
    ↑         ↓
    └── React Query Cache ← Real-time Updates
```

## 🔧 Building Connected Components

### 1. Create the Hook

Connected components use specialized hooks that handle data fetching, caching, and hydration:

```typescript
// lib/hooks/connected/use-example-data.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function useExampleData(id?: string, filters?: any) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['example', id, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (id) params.append('id', id);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/example?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      return response.json();
    },
    enabled: isMounted, // Only fetch after client-side mount
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: [] // Provide fallback data structure
  });

  const isInitialLoad = !isMounted;
  const showSkeleton = isInitialLoad || (query.isLoading && !query.data?.length);

  return {
    ...query,
    data: query.data || [],
    isInitialLoad,
    showSkeleton,
    isMounted
  };
}
```

### 2. Create the Connected Component

Connected components wrap premium UI components and provide data integration:

```typescript
// components/premium/connected/example/example-card-live.tsx
'use client';

import * as React from 'react';
import { ExampleCard, type ExampleCardProps } from '@/components/premium/ui/cards/example-card';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useExampleData } from '@/lib/hooks/connected/use-example-data';
import { cn } from '@/lib/utils';

export interface ExampleCardLiveProps extends Omit<ExampleCardProps, 'title' | 'value' | 'loading'> {
  /** ID of the resource to fetch */
  resourceId?: string;
  /** Filters to apply */
  filters?: any;
  /** Custom title override */
  title?: string;
  /** Fallback subtitle while loading */
  fallbackSubtitle?: string;
  /** Custom skeleton height */
  skeletonHeight?: number;
}

export const ExampleCardLive = React.forwardRef<HTMLDivElement, ExampleCardLiveProps>(
  ({ 
    resourceId,
    filters,
    title,
    fallbackSubtitle,
    skeletonHeight = 32,
    className,
    ...props 
  }, ref) => {
    const { 
      data, 
      error, 
      showSkeleton,
      isInitialLoad 
    } = useExampleData(resourceId, filters);

    // Handle error state
    if (error && !isInitialLoad) {
      return (
        <ExampleCard
          ref={ref}
          {...props}
          className={cn('border-red-200 dark:border-red-800', className)}
          title={title || 'Error'}
          value="Failed to load"
          subtitle="Please try again"
        />
      );
    }

    // Render with data or internal skeletons
    return (
      <ExampleCard
        ref={ref}
        {...props}
        className={className}
        title={title || 'Example Data'}
        value={showSkeleton ? (
          <SkeletonPremium 
            variant="default" 
            className={cn('w-24', `h-[${skeletonHeight}px]`)} 
          />
        ) : (
          data?.value || '0'
        )}
        subtitle={showSkeleton ? (
          fallbackSubtitle || (
            <SkeletonPremium variant="text" className="w-20 h-3" />
          )
        ) : (
          data?.subtitle
        )}
        loading={false} // NEVER show container loading state
      />
    );
  }
);

ExampleCardLive.displayName = 'ExampleCardLive';
```

### 3. Add Real-time Updates

For components that need real-time updates, integrate with our existing real-time system:

```typescript
// In the hook:
import { useRealtime } from '@/lib/hooks/use-realtime';

export function useExampleData(id?: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    // ... query config
  });

  // Set up real-time subscription
  useRealtime(['all']); // Subscribe to relevant channels

  // Handle real-time updates via cache updates (not invalidateQueries)
  useEffect(() => {
    const channel = supabase.channel(`example-${id}`);
    
    channel
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'example_table',
        filter: id ? `id=eq.${id}` : undefined
      }, (payload) => {
        // Update cache directly
        queryClient.setQueryData(['example', id], payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return query;
}
```

## 🎯 Hydration Strategy

### Smart Hydration Pattern

Our connected components use a "structure-first" hydration approach:

1. **SSR/Initial Render**: Component structure renders immediately
2. **Client Hydration**: `isMounted` becomes `true`, data fetching begins
3. **Loading State**: Internal skeletons show where data will appear
4. **Data Loaded**: Skeletons replaced with actual content
5. **Real-time**: Updates flow seamlessly through cache

### Hydration Utilities

```typescript
// lib/utils/hydration.ts provides helpful utilities:

import { useIsHydrated, useProgressiveLoading } from '@/lib/utils/hydration';

// Basic hydration detection
const isHydrated = useIsHydrated();

// Progressive loading with grace periods
const { isMounted, isReady, shouldFetch } = useProgressiveLoading();

// Persistent state across hydration
const [state, setState] = usePersistedState('key', defaultValue);
```

## 📊 Table Components

Table components require special handling for sorting and real-time updates:

```typescript
// components/premium/connected/data-display/table-live-example.tsx
export function TableLiveExample({
  endpoint,
  queryKey,
  columns,
  filters
}: TableLiveProps) {
  const {
    data,
    showSkeleton,
    handleSort,
    getSortIcon
  } = useTableData({
    endpoint,
    queryKey,
    filters,
    realtime: true
  });

  if (showSkeleton) {
    return <SkeletonTable rows={5} columns={columns.length} />;
  }

  return (
    <TablePremium>
      <TablePremiumHeader>
        <TablePremiumRow>
          {columns.map((column) => (
            <TablePremiumHead
              key={column.key}
              onClick={column.sortable ? () => handleSort(column.key) : undefined}
              className={column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}
            >
              <div className="flex items-center">
                {column.label}
                {column.sortable && getSortIconComponent(column.key)}
              </div>
            </TablePremiumHead>
          ))}
        </TablePremiumRow>
      </TablePremiumHeader>
      {/* ... body implementation */}
    </TablePremium>
  );
}
```

## 🔄 API Integration

### API Endpoint Requirements

Connected components require properly structured API endpoints:

```typescript
// app/api/example/route.ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '0');
    const filters = {/* extract filters */};

    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Use repository with relationships
    const repo = getRepository.example(true);
    const data = await repo.findAllWithRelations();

    // Apply filters and pagination
    const filteredData = applyFilters(data, filters);
    const paginatedData = limit > 0 ? filteredData.slice(0, limit) : filteredData;

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total: filteredData.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Status Endpoints

For real-time status updates:

```typescript
// app/api/example/[id]/status/route.ts
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const repo = getRepository.example(true);
  const item = await repo.findById(id);
  
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    status: item.status,
    id: item.id,
    updated_at: item.updated_at 
  });
}
```

## ✅ Best Practices

### DO ✅

1. **Use Progressive Hydration**
   ```typescript
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => setIsMounted(true), []);
   ```

2. **Provide Fallback Data**
   ```typescript
   placeholderData: { value: 0, trend: 'neutral' }
   ```

3. **Use Internal Skeletons**
   ```typescript
   value={showSkeleton ? <SkeletonPremium /> : data?.value}
   ```

4. **Update Cache Directly**
   ```typescript
   queryClient.setQueryData(['key'], newData);
   ```

5. **Handle Both Success and Error States**
   ```typescript
   if (error && !isInitialLoad) return <ErrorComponent />;
   ```

### DON'T ❌

1. **Never Show Container Skeletons**
   ```typescript
   // Wrong
   if (loading) return <SkeletonCard />;
   
   // Correct
   return <Card value={loading ? <Skeleton /> : data} />;
   ```

2. **Don't Use invalidateQueries in Real-time**
   ```typescript
   // Wrong - causes refetch
   onUpdate: () => queryClient.invalidateQueries(['key']);
   
   // Correct - direct cache update
   onUpdate: (payload) => queryClient.setQueryData(['key'], payload.new);
   ```

3. **Don't Fetch During SSR**
   ```typescript
   // Wrong
   enabled: true
   
   // Correct
   enabled: isMounted
   ```

## 🧪 Testing Connected Components

### Unit Testing

```typescript
// __tests__/components/example-card-live.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExampleCardLive } from '@/components/premium/connected/example/example-card-live';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ExampleCardLive', () => {
  it('shows skeleton during initial load', async () => {
    render(<ExampleCardLive resourceId="123" />, { wrapper: createWrapper() });
    
    // Should show skeleton initially
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays data after loading', async () => {
    // Mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ value: '42' })
    });

    render(<ExampleCardLive resourceId="123" />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

Test with real data and API endpoints:

```typescript
describe('ExampleCardLive Integration', () => {
  beforeEach(() => {
    // Start local Supabase
    // Seed test data
  });

  it('fetches and displays real data', async () => {
    render(<ExampleCardLive resourceId="real-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Expected Value')).toBeInTheDocument();
    });
  });
});
```

## 📝 Component Documentation Template

When creating a new connected component, include this documentation:

```typescript
/**
 * ExampleCardLive - Real-time example card component
 * 
 * @description Connected version of ExampleCard with live data updates
 * @category Connected/Example
 * 
 * @features
 * - Real-time data updates via cache updates
 * - Smart hydration with structure-first rendering
 * - Internal skeleton loading states
 * - Error handling with graceful fallbacks
 * 
 * @example
 * ```tsx
 * <ExampleCardLive
 *   resourceId="123"
 *   variant="primary"
 *   filters={{ status: 'active' }}
 *   title="Custom Title"
 * />
 * ```
 */
```

## 🚀 Performance Considerations

### Optimization Strategies

1. **Stale Time Configuration**
   ```typescript
   staleTime: 5 * 60 * 1000 // 5 minutes for dashboard metrics
   staleTime: 30 * 1000     // 30 seconds for status updates
   ```

2. **Selective Subscriptions**
   ```typescript
   // Only subscribe to relevant channels
   useRealtime(['tickets']); // Not ['all'] unless necessary
   ```

3. **Memoization**
   ```typescript
   const processedData = useMemo(() => {
     return expensiveTransformation(data);
   }, [data]);
   ```

4. **Batch Updates**
   ```typescript
   // Group related cache updates
   queryClient.setQueriesData(
     { queryKey: ['tickets'], exact: false },
     (oldData) => updateFunction(oldData)
   );
   ```

## 🔗 Integration with Existing Components

### Upgrading Static to Connected

To upgrade an existing static component to connected:

1. Create the data hook following patterns above
2. Create connected version wrapping the static component
3. Replace usage in dashboard/pages
4. Test hydration and real-time updates
5. Update documentation and exports

### Maintaining Compatibility

Connected components should maintain the same API as their static counterparts:

```typescript
// Static component props should be subset of connected component props
interface StaticProps {
  title: string;
  value: string;
  variant?: 'primary' | 'secondary';
}

interface ConnectedProps extends Omit<StaticProps, 'value'> {
  resourceId: string; // Added for data fetching
  title?: string;     // Made optional (can be inferred)
  // value removed (comes from data)
}
```

---

## 🎯 Quick Reference

### File Structure
```
components/premium/connected/
├── dashboard/
│   ├── metric-card-live.tsx
│   └── recent-activity-live.tsx
├── data-display/
│   └── table-premium-live.tsx
└── badges/
    └── status-badge-live.tsx

lib/hooks/connected/
├── use-metric-data.ts
├── use-activity-feed.ts
└── use-table-data.ts
```

### Key Imports
```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SkeletonPremium } from '@/components/premium/ui/feedback/skeleton-premium';
import { useRealtime } from '@/lib/hooks/use-realtime';
import { useState, useEffect } from 'react';
```

### Essential Patterns
- ✅ Structure-first rendering
- ✅ Progressive hydration with `isMounted`
- ✅ Internal skeletons, never container skeletons
- ✅ Cache updates for real-time, never invalidateQueries
- ✅ Error boundaries and fallback states
- ✅ Proper TypeScript typing with extended interfaces

This architecture ensures excellent user experience, maintainable code, and scalable real-time functionality across the entire CRM system.