# 🧪 Architecture-Aware Testing Strategy

> **Purpose**: Testing that validates our core architectural principles  
> **Focus**: Hydration strategy, real-time updates, repository patterns  
> **Goal**: Ensure tests verify actual system behavior, not just code coverage

## 🎯 Testing Our Core Principles

### Principle 1: Smart Hydration Strategy
Our components must render structure immediately and load data progressively without layout shifts.

### Principle 2: Real-time First
Cache updates via `setQueryData`, never `invalidateQueries` or `router.refresh()`

### Principle 3: Repository Pattern
All database operations through repositories, services handle business logic

### Principle 4: Optimistic Updates
UI responds immediately with rollback on errors

---

## 🧩 Testing the Hydration Strategy

### What We Need to Test

1. **SSR/Client Consistency** - No hydration mismatches
2. **Progressive Loading** - Structure first, data second
3. **hasLoadedOnce Pattern** - Prevents flash of empty state
4. **Skeleton Behavior** - Internal skeletons, not container skeletons
5. **Zero Layout Shift** - Component boundaries never change

### Test Implementation

```typescript
// tests/utils/hydration-test-utils.tsx
import React from 'react'
import { render, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToString } from 'react-dom/server'

export interface HydrationTestOptions {
  initialData?: any
  mockFetch?: boolean
  simulateSlowConnection?: boolean
}

/**
 * Test utility specifically for our hydration pattern
 */
export function renderWithHydration(
  component: React.ReactElement,
  options: HydrationTestOptions = {}
): RenderResult & {
  serverHtml: string
  expectNoHydrationMismatch: () => void
  expectSkeletonThenData: () => Promise<void>
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: options.simulateSlowConnection ? 0 : 5 * 60 * 1000,
      },
    },
  })

  // Wrap component with providers
  const WrappedComponent = () => (
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )

  // Server-side render
  const serverHtml = renderToString(<WrappedComponent />)

  // Client-side render
  const renderResult = render(<WrappedComponent />)

  return {
    ...renderResult,
    serverHtml,
    
    expectNoHydrationMismatch() {
      // Compare initial client HTML with server HTML
      const initialClientHtml = renderResult.container.innerHTML
      expect(initialClientHtml).toBe(serverHtml)
    },

    async expectSkeletonThenData() {
      // Should show skeleton initially
      expect(renderResult.container.querySelector('[data-testid="skeleton"]')).toBeInTheDocument()
      
      // Wait for data to load
      await waitFor(() => {
        expect(renderResult.container.querySelector('[data-testid="skeleton"]')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Should show real data
      expect(renderResult.container.querySelector('[data-testid="data"]')).toBeInTheDocument()
    }
  }
}

/**
 * Mock our standard data hook patterns
 */
export function mockHydrationHook(hookName: string, data: any) {
  const mockHook = jest.fn(() => {
    const [isMounted, setIsMounted] = useState(false)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

    useEffect(() => {
      setIsMounted(true)
      // Simulate data loading
      setTimeout(() => setHasLoadedOnce(true), 100)
    }, [])

    return {
      data: hasLoadedOnce ? data : { value: 0 },
      isLoading: !hasLoadedOnce,
      showSkeleton: !hasLoadedOnce,
      hasLoadedOnce,
      isMounted
    }
  })

  jest.doMock(`@/lib/hooks/${hookName}`, () => ({ [hookName]: mockHook }))
  return mockHook
}
```

### Hydration Test Examples

```typescript
// tests/unit/components/metric-card-live.test.tsx
import { MetricCardLive } from '@/components/premium/connected/dashboard/metric-card-live'
import { renderWithHydration } from '../../utils/hydration-test-utils'

describe('MetricCardLive Hydration', () => {
  beforeEach(() => {
    // Mock the dashboard data hook
    mockHydrationHook('useDashboardData', {
      total_tickets: 42,
      total_revenue: 1500.50
    })
  })

  it('follows proper hydration pattern', async () => {
    const { expectNoHydrationMismatch, expectSkeletonThenData } = 
      renderWithHydration(
        <MetricCardLive metric="total_tickets" title="Total Tickets" />
      )

    // Test 1: No hydration mismatch
    expectNoHydrationMismatch()

    // Test 2: Progressive loading (skeleton → data)
    await expectSkeletonThenData()
  })

  it('maintains component structure during loading', () => {
    const { container } = renderWithHydration(
      <MetricCardLive metric="total_tickets" title="Total Tickets" />
    )

    // Component structure should always be present
    expect(container.querySelector('[data-testid="metric-card"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="metric-title"]')).toBeInTheDocument()
    
    // Value area should contain skeleton, not be replaced by skeleton
    const valueArea = container.querySelector('[data-testid="metric-value"]')
    expect(valueArea).toBeInTheDocument()
    expect(valueArea?.querySelector('[data-testid="skeleton"]')).toBeInTheDocument()
  })

  it('prevents flash of no data', async () => {
    const { container } = renderWithHydration(
      <MetricCardLive metric="total_tickets" title="Total Tickets" />
    )

    // Should never show "No data" or "0" during initial load
    expect(container.textContent).not.toContain('No data')
    expect(container.textContent).not.toContain('0 tickets')
    
    // Should show skeleton
    expect(container.querySelector('[data-testid="skeleton"]')).toBeInTheDocument()
  })
})
```

---

## 🔄 Testing Real-time Updates

### What We Need to Test

1. **Direct Cache Updates** - Using `setQueryData`, not `invalidateQueries`
2. **Optimistic Updates** - Immediate UI changes with rollback
3. **Real-time Subscriptions** - WebSocket events update cache
4. **Multi-user Scenarios** - Changes from other users appear instantly

### Test Implementation

```typescript
// tests/utils/realtime-test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

/**
 * Mock Supabase client that simulates real-time behavior
 */
export function createMockRealtimeClient() {
  const channels = new Map()
  const subscriptions = new Map()

  return {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    channel: jest.fn((name: string) => {
      const channel = {
        on: jest.fn((event, config, callback) => {
          const key = `${name}-${event}-${config.table}`
          subscriptions.set(key, callback)
          return channel
        }),
        subscribe: jest.fn(),
      }
      channels.set(name, channel)
      return channel
    }),
    removeChannel: jest.fn(),
    
    // Test helper: Simulate real-time events
    simulateRealtimeEvent(channelName: string, eventType: string, table: string, payload: any) {
      const key = `${channelName}-postgres_changes-${table}`
      const callback = subscriptions.get(key)
      if (callback) {
        callback({
          eventType,
          new: eventType === 'DELETE' ? null : payload,
          old: eventType === 'INSERT' ? null : payload,
        })
      }
    }
  }
}

/**
 * Test real-time cache updates
 */
export function renderWithRealtime(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  const mockSupabase = createMockRealtimeClient()
  
  // Mock the Supabase client
  jest.spyOn(require('@/lib/supabase/client'), 'createClient')
    .mockReturnValue(mockSupabase)

  const result = render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )

  return {
    ...result,
    queryClient,
    mockSupabase,
    
    // Helper to simulate real-time events
    simulateRealtimeUpdate(table: string, data: any) {
      mockSupabase.simulateRealtimeEvent('test-channel', 'UPDATE', table, data)
    },
    
    simulateRealtimeInsert(table: string, data: any) {
      mockSupabase.simulateRealtimeEvent('test-channel', 'INSERT', table, data)
    },
    
    simulateRealtimeDelete(table: string, data: any) {
      mockSupabase.simulateRealtimeEvent('test-channel', 'DELETE', table, data)
    }
  }
}
```

### Real-time Test Examples

```typescript
// tests/unit/hooks/use-tickets.test.tsx
import { renderHook } from '@testing-library/react'
import { useTickets } from '@/lib/hooks/use-tickets'
import { renderWithRealtime } from '../../utils/realtime-test-utils'

describe('useTickets Real-time', () => {
  it('updates cache directly on real-time events', async () => {
    const { queryClient, simulateRealtimeUpdate } = renderWithRealtime(
      <div>Test Component</div>
    )

    // Set initial data
    queryClient.setQueryData(['tickets'], [
      { id: '1', ticket_number: 'T001', status: 'new' }
    ])

    // Simulate real-time update
    simulateRealtimeUpdate('repair_tickets', {
      id: '1',
      ticket_number: 'T001',
      status: 'in_progress'
    })

    // Cache should be updated directly
    const updatedData = queryClient.getQueryData(['tickets'])
    expect(updatedData).toEqual([
      { id: '1', ticket_number: 'T001', status: 'in_progress' }
    ])
  })

  it('does NOT use invalidateQueries for real-time', () => {
    const { queryClient } = renderWithRealtime(<div>Test</div>)
    
    // Spy on invalidateQueries to ensure it's not called
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    
    // Simulate real-time event
    simulateRealtimeUpdate('repair_tickets', { id: '1', status: 'completed' })
    
    // invalidateQueries should NEVER be called for real-time
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('handles optimistic updates with rollback', async () => {
    const { result } = renderHook(() => useUpdateTicket('1'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      )
    })

    // Mock failed API call
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

    // Set initial data
    const queryClient = result.current.queryClient
    queryClient.setQueryData(['tickets'], [
      { id: '1', status: 'new', ticket_number: 'T001' }
    ])

    // Trigger optimistic update
    result.current.mutate({ status: 'completed' })

    // Should immediately show optimistic state
    let currentData = queryClient.getQueryData(['tickets'])
    expect(currentData[0].status).toBe('completed')

    // Wait for mutation to fail and rollback
    await waitFor(() => {
      currentData = queryClient.getQueryData(['tickets'])
      expect(currentData[0].status).toBe('new') // Rolled back
    })
  })
})
```

---

## 🏗️ Testing Repository & Service Patterns

### What We Need to Test

1. **Repository Layer** - Database operations abstraction
2. **Service Layer** - Business logic and validation
3. **Singleton Pattern** - Repository manager usage
4. **Error Handling** - Proper error propagation
5. **Authorization** - RLS and permission checks

### Test Implementation

```typescript
// tests/utils/repository-test-utils.ts
import { createClient } from '@supabase/supabase-js'

/**
 * Create isolated test database client
 */
export function createTestSupabaseClient() {
  return createClient(
    process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_TEST_ANON_KEY || 'test-key'
  )
}

/**
 * Clean test database between tests
 */
export async function cleanTestDatabase(supabase: any) {
  // Clean in dependency order
  await supabase.from('time_entries').delete().gte('id', 0)
  await supabase.from('ticket_services').delete().gte('id', 0)
  await supabase.from('ticket_notes').delete().gte('id', 0)
  await supabase.from('repair_tickets').delete().gte('id', 0)
  await supabase.from('customer_devices').delete().gte('id', 0)
  await supabase.from('customers').delete().gte('id', 0)
  await supabase.from('users').delete().gte('id', 0)
}

/**
 * Seed consistent test data
 */
export async function seedTestData(supabase: any) {
  // Create test user
  const { data: testUser } = await supabase
    .from('users')
    .insert({
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'technician'
    })
    .select()
    .single()

  // Create test customer
  const { data: testCustomer } = await supabase
    .from('customers')
    .insert({
      id: 'test-customer-id',
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '555-1234'
    })
    .select()
    .single()

  return { testUser, testCustomer }
}

/**
 * Mock authentication context
 */
export function mockAuthContext(user: any = null) {
  jest.spyOn(require('@/lib/supabase/server'), 'createClient')
    .mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ 
          data: { user }, 
          error: null 
        })
      }
    })
}
```

### Repository Test Examples

```typescript
// tests/unit/repositories/repair-ticket.repository.test.ts
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository'
import { createTestSupabaseClient, cleanTestDatabase, seedTestData } from '../../utils/repository-test-utils'

describe('RepairTicketRepository', () => {
  let supabase: any
  let repository: RepairTicketRepository
  let testData: any

  beforeAll(async () => {
    supabase = createTestSupabaseClient()
    repository = new RepairTicketRepository(supabase)
  })

  beforeEach(async () => {
    await cleanTestDatabase(supabase)
    testData = await seedTestData(supabase)
  })

  describe('Repository Pattern Compliance', () => {
    it('uses BaseRepository methods', () => {
      expect(repository.findAll).toBeDefined()
      expect(repository.findById).toBeDefined()
      expect(repository.create).toBeDefined()
      expect(repository.update).toBeDefined()
      expect(repository.delete).toBeDefined()
    })

    it('handles database errors properly', async () => {
      // Try to create ticket with invalid data
      await expect(repository.create({
        // Missing required fields
        description: 'Test'
      })).rejects.toThrow()
    })
  })

  describe('Business Logic Methods', () => {
    it('creates ticket with proper defaults', async () => {
      const ticketData = {
        customer_id: testData.testCustomer.id,
        device_brand: 'Apple',
        device_model: 'iPhone 14',
        description: 'Screen replacement',
        priority: 'medium'
      }

      const ticket = await repository.create(ticketData)

      expect(ticket).toMatchObject({
        status: 'new',
        priority: 'medium',
        ticket_number: expect.stringMatching(/^T\d{6}$/)
      })
    })

    it('finds tickets with relationships', async () => {
      // Create test ticket
      const ticket = await repository.create({
        customer_id: testData.testCustomer.id,
        description: 'Test ticket'
      })

      // Find with details
      const ticketWithDetails = await repository.getTicketWithDetails(ticket.id)

      expect(ticketWithDetails).toMatchObject({
        id: ticket.id,
        customers: expect.objectContaining({
          name: 'Test Customer'
        })
      })
    })
  })

  describe('Repository Manager Integration', () => {
    it('works with singleton pattern', () => {
      const { getRepository } = require('@/lib/repositories/repository-manager')
      
      const repo1 = getRepository.tickets()
      const repo2 = getRepository.tickets()
      
      // Should return same instance
      expect(repo1).toBe(repo2)
    })
  })
})
```

### Service Layer Test Examples

```typescript
// tests/unit/services/repair-ticket.service.test.ts
import { RepairTicketService } from '@/lib/services/repair-ticket.service'
import { mockAuthContext, cleanTestDatabase, seedTestData } from '../../utils/repository-test-utils'

describe('RepairTicketService', () => {
  let service: RepairTicketService
  let testData: any

  beforeEach(async () => {
    service = new RepairTicketService()
    testData = await seedTestData(createTestSupabaseClient())
    mockAuthContext(testData.testUser)
  })

  describe('Business Logic Validation', () => {
    it('validates required fields', async () => {
      await expect(service.createTicket({
        // Missing customer_id
        description: 'Test'
      })).rejects.toThrow('Customer ID is required')
    })

    it('enforces business rules', async () => {
      const ticketData = {
        customer_id: testData.testCustomer.id,
        description: 'Test ticket',
        estimated_cost: -100 // Invalid
      }

      await expect(service.createTicket(ticketData))
        .rejects.toThrow('Estimated cost cannot be negative')
    })
  })

  describe('Status Workflow', () => {
    it('follows proper status transitions', async () => {
      // Create ticket
      const ticket = await service.createTicket({
        customer_id: testData.testCustomer.id,
        description: 'Test'
      })

      expect(ticket.status).toBe('new')

      // Valid transition
      const updated = await service.updateStatus(ticket.id, 'in_progress')
      expect(updated.status).toBe('in_progress')

      // Invalid transition should be rejected
      await expect(service.updateStatus(ticket.id, 'new'))
        .rejects.toThrow('Cannot move ticket backwards from in_progress to new')
    })

    it('sets completion date when completed', async () => {
      const ticket = await service.createTicket({
        customer_id: testData.testCustomer.id,
        description: 'Test'
      })

      const completed = await service.updateStatus(ticket.id, 'completed')
      
      expect(completed.status).toBe('completed')
      expect(completed.date_completed).toBeDefined()
    })
  })

  describe('Integration with Other Services', () => {
    it('triggers notifications on status change', async () => {
      const notificationSpy = jest.spyOn(service.notificationService, 'notify')
      
      const ticket = await service.createTicket({
        customer_id: testData.testCustomer.id,
        description: 'Test'
      })

      await service.updateStatus(ticket.id, 'completed')

      expect(notificationSpy).toHaveBeenCalledWith({
        type: 'ticket_completed',
        ticketId: ticket.id,
        customerId: testData.testCustomer.id
      })
    })
  })
})
```

---

## 🎛️ Integration Testing

### End-to-End Workflow Tests

```typescript
// tests/integration/repair-order-workflow.test.ts
describe('Complete Repair Order Workflow', () => {
  it('handles full repair order lifecycle', async () => {
    // 1. Customer creates appointment
    const appointment = await createAppointment({
      customerName: 'John Doe',
      device: 'iPhone 14',
      issue: 'Cracked screen'
    })

    // 2. Convert to repair ticket
    const ticket = await convertAppointmentToTicket(appointment.id)
    expect(ticket.status).toBe('new')

    // 3. Assign technician
    await assignTechnician(ticket.id, 'tech-user-id')

    // 4. Start work
    await startTimer(ticket.id)
    const inProgressTicket = await updateTicketStatus(ticket.id, 'in_progress')
    expect(inProgressTicket.timer_started_at).toBeDefined()

    // 5. Add services
    await addServices(ticket.id, ['screen-replacement', 'cleaning'])

    // 6. Complete work
    await stopTimer(ticket.id)
    const completedTicket = await updateTicketStatus(ticket.id, 'completed')
    
    expect(completedTicket.status).toBe('completed')
    expect(completedTicket.date_completed).toBeDefined()
    expect(completedTicket.total_timer_minutes).toBeGreaterThan(0)

    // 7. Generate invoice
    const invoice = await generateInvoice(ticket.id)
    expect(invoice.total_amount).toBeGreaterThan(0)

    // 8. Verify all real-time updates occurred
    expectRealtimeEventsTriggered([
      'ticket_created',
      'ticket_assigned',
      'timer_started',
      'services_added',
      'timer_stopped',
      'ticket_completed',
      'invoice_generated'
    ])
  })
})
```

### Real-time Multi-User Testing

```typescript
// tests/integration/multi-user-realtime.test.ts
describe('Multi-User Real-time Updates', () => {
  it('syncs changes across multiple clients', async () => {
    // Simulate two users viewing the same ticket
    const client1 = renderTicketDetail('ticket-123')
    const client2 = renderTicketDetail('ticket-123')

    // User 1 updates status
    await client1.updateStatus('in_progress')

    // User 2 should see the change immediately
    await waitFor(() => {
      expect(client2.getStatus()).toBe('in_progress')
    })

    // User 2 adds a note
    await client2.addNote('Work started on screen replacement')

    // User 1 should see the note immediately
    await waitFor(() => {
      expect(client1.getNotes()).toContainEqual(
        expect.objectContaining({
          content: 'Work started on screen replacement'
        })
      )
    })
  })

  it('handles concurrent updates gracefully', async () => {
    const ticket = await createTestTicket()

    // Simulate concurrent status updates
    const promise1 = updateTicketStatus(ticket.id, 'in_progress')
    const promise2 = updateTicketStatus(ticket.id, 'on_hold')

    const [result1, result2] = await Promise.allSettled([promise1, promise2])

    // One should succeed, one should fail with conflict error
    expect(
      (result1.status === 'fulfilled' && result2.status === 'rejected') ||
      (result1.status === 'rejected' && result2.status === 'fulfilled')
    ).toBe(true)
  })
})
```

---

## 📊 Testing Performance & Architecture Compliance

### Hydration Performance Tests

```typescript
// tests/performance/hydration.test.ts
describe('Hydration Performance', () => {
  it('maintains fast FCP with progressive loading', async () => {
    const startTime = performance.now()
    
    const { container } = renderWithHydration(
      <DashboardLive />
    )

    // Structure should render immediately
    const fcpTime = performance.now() - startTime
    expect(fcpTime).toBeLessThan(100) // < 100ms

    // Should show skeletons, not empty content
    expect(container.querySelector('[data-testid="skeleton"]')).toBeInTheDocument()
    expect(container.textContent).not.toContain('No data')
  })

  it('prevents layout shifts during data loading', async () => {
    const { container } = renderWithHydration(
      <MetricCardLive metric="revenue" />
    )

    // Measure initial dimensions
    const card = container.querySelector('[data-testid="metric-card"]')
    const initialHeight = card?.offsetHeight
    const initialWidth = card?.offsetWidth

    // Wait for data to load
    await waitFor(() => {
      expect(container.querySelector('[data-testid="skeleton"]')).not.toBeInTheDocument()
    })

    // Dimensions should not have changed
    expect(card?.offsetHeight).toBe(initialHeight)
    expect(card?.offsetWidth).toBe(initialWidth)
  })
})
```

### Real-time Performance Tests

```typescript
// tests/performance/realtime.test.ts
describe('Real-time Performance', () => {
  it('updates cache directly without refetches', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    
    const { simulateRealtimeUpdate } = renderWithRealtime(
      <TicketsList />
    )

    // Clear any initial fetches
    fetchSpy.mockClear()

    // Simulate real-time update
    simulateRealtimeUpdate('repair_tickets', {
      id: 'ticket-1',
      status: 'completed'
    })

    // Should NOT trigger any fetches
    expect(fetchSpy).not.toHaveBeenCalled()

    // But UI should be updated
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('handles high-frequency updates efficiently', async () => {
    const { simulateRealtimeUpdate, queryClient } = renderWithRealtime(
      <TicketsList />
    )

    const setCacheDataSpy = jest.spyOn(queryClient, 'setQueryData')

    // Simulate rapid updates
    for (let i = 0; i < 100; i++) {
      simulateRealtimeUpdate('repair_tickets', {
        id: 'ticket-1',
        updated_at: new Date().toISOString()
      })
    }

    // Should batch/debounce updates efficiently
    expect(setCacheDataSpy.mock.calls.length).toBeLessThan(100)
  })
})
```

---

## 🎯 Architecture Compliance Test Suite

```typescript
// tests/compliance/architecture-compliance.test.ts
describe('Architecture Compliance', () => {
  describe('Hydration Strategy Compliance', () => {
    const connectedComponents = [
      'MetricCardLive',
      'TablePremiumLive',
      'CustomersTableLive',
      'OrdersTableLive',
      'DashboardLive'
    ]

    connectedComponents.forEach(componentName => {
      it(`${componentName} follows hydration patterns`, async () => {
        const Component = require(`@/components/premium/connected/${componentName}`)
        
        const { expectNoHydrationMismatch, expectSkeletonThenData } = 
          renderWithHydration(<Component />)

        await expectNoHydrationMismatch()
        await expectSkeletonThenData()
      })
    })
  })

  describe('Real-time Strategy Compliance', () => {
    it('never uses router.refresh()', () => {
      // Scan codebase for router.refresh usage
      const forbiddenPatterns = [
        'router.refresh()',
        'window.location.reload()',
        'location.reload()'
      ]

      forbiddenPatterns.forEach(pattern => {
        expect(codebaseContains(pattern)).toBe(false)
      })
    })

    it('never uses invalidateQueries in real-time handlers', () => {
      // Check that real-time handlers use setQueryData
      const realtimeFiles = glob.sync('**/*realtime*.ts')
      
      realtimeFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8')
        expect(content).not.toContain('invalidateQueries')
        expect(content).toContain('setQueryData')
      })
    })
  })

  describe('Repository Pattern Compliance', () => {
    it('all database operations use repositories', () => {
      // Check that components don't import Supabase client directly
      const componentFiles = glob.sync('components/**/*.tsx')
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8')
        
        if (content.includes('"use client"')) {
          expect(content).not.toContain('from(\'')
          expect(content).not.toContain('supabase.')
        }
      })
    })
  })
})
```

---

## 🚀 Running Architecture-Aware Tests

### Test Scripts for package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:hydration": "jest --testNamePattern=\"hydration|Hydration\"",
    "test:realtime": "jest --testNamePattern=\"realtime|Realtime\"",
    "test:architecture": "jest tests/compliance/",
    "test:performance": "jest tests/performance/",
    "test:integration": "jest tests/integration/",
    "test:watch-patterns": "jest --watch --testNamePattern=\"hydration|realtime\"",
    "test:compliance": "npm run test:architecture && npm run test:hydration && npm run test:realtime"
  }
}
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit

# Run architecture compliance tests before allowing commit
npm run test:compliance

# Check for anti-patterns
if grep -r "router.refresh()" --include="*.ts" --include="*.tsx" .; then
  echo "❌ Found router.refresh() usage - use setQueryData instead"
  exit 1
fi

if grep -r "invalidateQueries.*realtime" --include="*.ts" --include="*.tsx" .; then
  echo "❌ Found invalidateQueries in real-time context - use setQueryData instead"
  exit 1
fi

echo "✅ Architecture compliance checks passed"
```

This architecture-aware testing strategy ensures our tests validate the actual principles that make our system work, not just code coverage numbers. Every test reinforces our core architectural decisions and catches regressions that could break our user experience.
