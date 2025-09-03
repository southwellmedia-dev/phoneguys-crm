# 🛠️ Development Guidelines - The Phone Guys CRM

> **This document establishes coding standards, folder structures, and development patterns to ensure consistency across the project.**

---

## 📁 Project Structure

```
phoneguys-crm/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication group routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── layout.tsx       # Dashboard layout wrapper
│   │   ├── page.tsx         # Dashboard home
│   │   ├── orders/          # Order management
│   │   │   ├── page.tsx     # Orders list
│   │   │   └── [id]/        # Order detail
│   │   ├── customers/       # Customer management
│   │   │   ├── page.tsx     # Customers list
│   │   │   └── [id]/        # Customer detail
│   │   ├── reports/         # Reporting section
│   │   └── settings/        # Settings pages
│   ├── api/                 # API Routes
│   │   ├── repairs/         # External API for Astro
│   │   ├── orders/          # Internal order API
│   │   ├── customers/       # Customer API
│   │   └── notifications/   # Notification API
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   └── providers.tsx        # App-wide providers
│
├── components/              # React Components
│   ├── ui/                 # shadcn/ui primitives
│   ├── forms/              # Form components
│   ├── tables/             # Table components
│   ├── charts/             # Chart components
│   └── layout/             # Layout components
│
├── lib/                    # Core library code
│   ├── repositories/       # Data access layer
│   ├── services/          # Business logic layer
│   ├── supabase/          # Supabase clients
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript types
│   └── validations/       # Zod schemas
│
├── public/                # Static assets
├── supabase/             # Supabase config
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge functions (if needed)
│   └── seed.sql          # Seed data
└── docs/                 # Documentation
```

## 🏗️ Architecture Patterns

### 1. Repository Pattern
Each entity should have its own repository for data access:

```typescript
// lib/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected useServiceRole: boolean;

  constructor(tableName: string, useServiceRole = false) {
    this.tableName = tableName;
    this.useServiceRole = useServiceRole;
  }

  protected async getClient(): Promise<SupabaseClient> {
    if (this.useServiceRole) {
      return createServiceClient(); // Bypasses RLS for API operations
    }
    return createClient(); // Uses cookies for authenticated users
  }

  async findAll(filters?: any): Promise<T[]> {
    // Implementation
  }

  async findById(id: string): Promise<T | null> {
    // Implementation
  }

  async create(data: Partial<T>): Promise<T> {
    // Implementation
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Implementation
  }

  async delete(id: string): Promise<boolean> {
    // Implementation
  }
}

// lib/repositories/repair-ticket.repository.ts
export class RepairTicketRepository extends BaseRepository<RepairTicket> {
  constructor(useServiceRole = false) {
    super('repair_tickets', useServiceRole);
  }

  async findByStatus(status: TicketStatus): Promise<RepairTicket[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status);
    
    if (error) throw error;
    return data;
  }

  // Additional specific methods
}
```

### 2. Service Layer
Business logic should be encapsulated in services:

```typescript
// lib/services/repair-order.service.ts
export class RepairOrderService {
  private ticketRepo: RepairTicketRepository;
  private notificationService: NotificationService;

  constructor() {
    this.ticketRepo = new RepairTicketRepository();
    this.notificationService = new NotificationService();
  }

  async createRepairOrder(data: CreateRepairOrderDto): Promise<RepairTicket> {
    // Validate data
    const validated = repairOrderSchema.parse(data);
    
    // Create ticket
    const ticket = await this.ticketRepo.create(validated);
    
    // Send notifications
    await this.notificationService.notifyNewTicket(ticket);
    
    return ticket;
  }

  async updateStatus(ticketId: string, newStatus: TicketStatus): Promise<void> {
    // Business logic for status changes
    const ticket = await this.ticketRepo.findById(ticketId);
    
    if (!ticket) throw new Error('Ticket not found');
    
    // Validate status transition
    this.validateStatusTransition(ticket.status, newStatus);
    
    // Update ticket
    await this.ticketRepo.update(ticketId, { status: newStatus });
    
    // Send appropriate notifications
    await this.notificationService.notifyStatusChange(ticket, newStatus);
  }
}
```

### 3. API Route Handler Pattern

```typescript
// app/api/repairs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepairOrderService } from '@/lib/services/repair-order.service';
import { createRepairOrderSchema } from '@/lib/validations/repair-order.schema';

// IMPORTANT: Create service instances inside request handlers to avoid request scope issues
export async function POST(request: NextRequest) {
  // Create service instance within request scope
  const repairService = new RepairOrderService(true); // true = use service role for API
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = createRepairOrderSchema.parse(body);
    
    // Process through service layer
    const ticket = await repairService.createRepairOrder(validated);
    
    // Return response
    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Repair order created successfully'
    }, { status: 201 });
    
  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

## 🎨 Component Structure

### Component Organization
```typescript
// components/orders/OrderCard.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RepairTicket } from '@/lib/types/repair-ticket';

interface OrderCardProps {
  order: RepairTicket;
  onStatusChange?: (status: TicketStatus) => void;
  onTimerToggle?: () => void;
}

export function OrderCard({ order, onStatusChange, onTimerToggle }: OrderCardProps) {
  return (
    <Card>
      {/* Component implementation */}
    </Card>
  );
}
```

### Component Best Practices
1. **Single Responsibility**: Each component should do one thing well
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Composition**: Use smaller components to build larger ones
4. **No Direct Database Access**: Components should receive data via props or hooks
5. **Error Boundaries**: Wrap complex components in error boundaries

## 🎯 TypeScript Guidelines

### Type Definitions
```typescript
// lib/types/repair-ticket.ts
export interface RepairTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  device_brand: string;
  device_model: string;
  serial_number?: string;
  imei?: string;
  repair_issues: RepairIssue[];
  status: TicketStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = 'new' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type RepairIssue = 'screen_crack' | 'battery_issue' | 'charging_port' | 'water_damage' | 'other';

// DTOs (Data Transfer Objects)
export interface CreateRepairOrderDto {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  device: {
    brand: string;
    model: string;
    serial_number?: string;
    imei?: string;
  };
  repair_issues: RepairIssue[];
  description?: string;
  priority?: Priority;
}
```

### Validation Schemas (using Zod)
```typescript
// lib/validations/repair-order.schema.ts
import { z } from 'zod';

export const createRepairOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
  }),
  device: z.object({
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    serial_number: z.string().optional(),
    imei: z.string().optional(),
  }),
  repair_issues: z.array(z.enum(['screen_crack', 'battery_issue', 'charging_port', 'water_damage', 'other']))
    .min(1, 'At least one issue must be selected'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type CreateRepairOrderInput = z.infer<typeof createRepairOrderSchema>;
```

## 🪝 Custom Hooks Pattern

```typescript
// lib/hooks/useRepairOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepairOrderService } from '@/lib/services/repair-order.service';

const repairService = new RepairOrderService();

export function useRepairOrders(filters?: RepairOrderFilters) {
  return useQuery({
    queryKey: ['repair-orders', filters],
    queryFn: () => repairService.getOrders(filters),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: TicketStatus }) => 
      repairService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-orders'] });
    },
  });
}

// Usage in component
function OrdersList() {
  const { data: orders, isLoading } = useRepairOrders({ status: 'new' });
  const updateStatus = useUpdateOrderStatus();
  
  const handleStatusChange = (orderId: string, newStatus: TicketStatus) => {
    updateStatus.mutate({ orderId, status: newStatus });
  };
  
  // Component render
}
```

## 📝 Naming Conventions

### Files and Folders
- **Components**: PascalCase (e.g., `OrderCard.tsx`)
- **Utilities/Hooks**: camelCase (e.g., `useTimer.ts`, `formatDate.ts`)
- **Types/Interfaces**: PascalCase with `.types.ts` or `.d.ts`
- **API Routes**: kebab-case folders (e.g., `repair-orders/`)
- **Services/Repositories**: kebab-case with pattern suffix (e.g., `repair-order.service.ts`)

### Code Conventions
```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT_MS = 5000;

// Enums: PascalCase with PascalCase values
enum OrderStatus {
  New = 'new',
  InProgress = 'in_progress',
  OnHold = 'on_hold',
  Completed = 'completed',
}

// Interfaces/Types: PascalCase with 'I' prefix optional
interface IRepairTicket { } // or just RepairTicket

// Functions: camelCase
function calculateRepairCost() { }

// React Components: PascalCase
function OrderDetailPage() { }

// CSS Classes: kebab-case (using Tailwind)
className="order-card-container"
```

## 🔧 Environment Configuration

### Development vs Production
```bash
# Local development uses .env.local
.env.local                    # Local development configuration
.env.local.production         # Production configuration (rename to .env.local for production)

# Key environment variables:
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Public anon key
SUPABASE_SERVICE_ROLE_KEY     # Service role key (server-side only, bypasses RLS)
```

### Supabase Client Usage
```typescript
// lib/supabase/server.ts - For authenticated users (uses cookies)
import { createClient } from '@/lib/supabase/server';

// lib/supabase/service.ts - For service operations (bypasses RLS)
import { createServiceClient } from '@/lib/supabase/service';

// IMPORTANT: Service client should only be used in secure server-side contexts
// Never expose service role key to client-side code
```

### Database Migrations
```bash
# Create new migration
npx supabase migration new <migration_name>

# Apply migrations and reset with seed data
npx supabase db reset

# Pull remote schema (be careful not to overwrite local changes)
npx supabase db pull --password "your-password"

# Push to production (use with caution!)
npx supabase db push --password "your-password"
```

## 🔒 Security Best Practices

### Input Validation
```typescript
// Always validate input at API boundaries
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate with Zod schema
  const result = createRepairOrderSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: result.error.flatten()
    }, { status: 400 });
  }
  
  // Process validated data
  const validatedData = result.data;
}
```

### Authentication Check
```typescript
// app/api/orders/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check user role
  const userRole = user.user_metadata?.role;
  if (!['admin', 'technician', 'manager'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Process request
}
```

## 🧪 Testing Structure

```
__tests__/
├── unit/                    # Unit tests
│   ├── repositories/
│   ├── services/
│   └── utils/
├── integration/            # Integration tests
│   └── api/
└── e2e/                   # End-to-end tests
    ├── auth.test.ts
    └── repair-flow.test.ts
```

### Test File Naming
- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## 📊 State Management

### Server State (React Query)
```typescript
// For server state, use React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Client State (Zustand for complex state)
```typescript
// lib/stores/timer.store.ts
import { create } from 'zustand';

interface TimerState {
  activeTimers: Record<string, number>;
  startTimer: (ticketId: string) => void;
  stopTimer: (ticketId: string) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  activeTimers: {},
  startTimer: (ticketId) => {
    // Implementation
  },
  stopTimer: (ticketId) => {
    // Implementation
  },
}));
```

## 🎯 Error Handling

### Custom Error Classes
```typescript
// lib/errors/app.errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
```

### Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

## 📋 Git Commit Conventions

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```bash
feat(orders): add timer functionality to repair orders
fix(auth): resolve login redirect issue
docs(api): update API documentation for repair endpoints
refactor(services): extract notification logic to separate service
```

## 🚀 Performance Guidelines

1. **Use React.memo** for expensive components
2. **Implement virtualization** for long lists
3. **Lazy load** routes and components
4. **Optimize images** with Next.js Image component
5. **Use proper caching** strategies with React Query
6. **Implement debouncing** for search inputs
7. **Use pagination** for large datasets

## 📝 Documentation Standards

Every major component/service should have:
1. **JSDoc comments** for functions
2. **README** in feature folders
3. **Inline comments** for complex logic
4. **Type definitions** for all data structures
5. **Examples** in documentation

```typescript
/**
 * Creates a new repair order and sends notifications
 * @param data - The repair order creation data
 * @returns The created repair ticket
 * @throws {ValidationError} If data validation fails
 * @throws {AppError} If creation fails
 * @example
 * const ticket = await createRepairOrder({
 *   customer: { name: 'John Doe', email: 'john@example.com' },
 *   device: { brand: 'Apple', model: 'iPhone 14' },
 *   repair_issues: ['screen_crack']
 * });
 */
async function createRepairOrder(data: CreateRepairOrderDto): Promise<RepairTicket> {
  // Implementation
}
```

## ⚠️ Common Gotchas & Solutions

### 1. Request Scope Issues
**Problem:** "cookies was called outside a request scope"
**Solution:** Create service/repository instances inside request handlers, not at module level

```typescript
// ❌ Wrong - creates instance at module level
const service = new RepairOrderService();
export async function POST(request) { ... }

// ✅ Correct - creates instance inside handler
export async function POST(request) {
  const service = new RepairOrderService();
  ...
}
```

### 2. RLS Policy Violations
**Problem:** "new row violates row-level security policy"
**Solution:** Use service role for API operations that bypass authentication

```typescript
// For external API endpoints
const repository = new CustomerRepository(true); // true = use service role
```

### 3. Database Schema Mismatches
**Problem:** Type definitions don't match actual database columns
**Solution:** Always check migration files and update types accordingly

```bash
# Check current schema
grep -A 20 "CREATE TABLE.*table_name" supabase/migrations/*.sql
```

### 4. Environment Variables Not Loading
**Problem:** Next.js not picking up correct environment file
**Solution:** Ensure .env.local exists for development (not .env.local.development)

### 5. Nullable Fields
**Problem:** Database requires non-null values for optional fields
**Solution:** Create migrations to make fields nullable when needed

```sql
ALTER TABLE table_name ALTER COLUMN column_name DROP NOT NULL;
```

---

**These guidelines should be followed by all developers and AI agents working on the project to maintain consistency and quality.**