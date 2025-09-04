# The Phone Guys CRM - Architecture Overview

> A comprehensive analysis of the current application architecture, data flow patterns, and technical implementation details.
>
> **Document Version**: 1.0  
> **Last Updated**: January 2025  
> **Purpose**: Performance optimization baseline documentation

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Authentication & Authorization](#authentication--authorization)
6. [Repository Pattern Implementation](#repository-pattern-implementation)
7. [Service Layer Architecture](#service-layer-architecture)
8. [Client-Server Communication](#client-server-communication)
9. [Real-Time Features](#real-time-features)
10. [Performance Characteristics](#performance-characteristics)
11. [Architecture Strengths](#architecture-strengths)
12. [Architecture Weaknesses](#architecture-weaknesses)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router (React Server Components + Client)      │
│  ├── Server Components (SSR)                               │
│  ├── Client Components ("use client")                      │
│  └── API Routes (/api/*)                                   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  ├── RepairOrderService                                    │
│  ├── CustomerService                                       │
│  ├── AppointmentService                                    │
│  └── [Other Services]                                      │
├─────────────────────────────────────────────────────────────┤
│                  Repository Layer                           │
│  ├── BaseRepository (Abstract)                             │
│  ├── RepairTicketRepository                               │
│  ├── CustomerRepository                                    │
│  └── [Other Repositories]                                  │
├─────────────────────────────────────────────────────────────┤
│              Supabase Client Libraries                      │
│  ├── Server Client (SSR)                                   │
│  ├── Browser Client (CSR)                                  │
│  └── Service Client (Admin)                                │
├─────────────────────────────────────────────────────────────┤
│                  Supabase Platform                          │
│  ├── PostgreSQL Database                                   │
│  ├── Row Level Security (RLS)                            │
│  ├── Authentication (Auth)                                 │
│  ├── Real-time Subscriptions                              │
│  └── Storage (Images/Files)                               │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Next.js 15**: Latest version with App Router
- **React 19**: Latest React with Server Components
- **TypeScript 5**: Full type safety across application

### UI/Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **shadcn/ui**: Component library (New York style)
- **Radix UI**: Headless component primitives
- **Lucide Icons**: Icon library

### Data Management
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - File storage
- **@supabase/ssr**: Server-side rendering support
- **@supabase/supabase-js**: Client SDK

### Forms & Validation
- **React Hook Form 7.62**: Form state management
- **Zod 4.1**: Schema validation
- **@hookform/resolvers**: Integration layer

### Data Visualization
- **Recharts 3.1**: Charts and graphs
- **@tanstack/react-table 8.21**: Advanced data tables

### Developer Experience
- **ESLint 9**: Code quality
- **Turbopack**: Fast bundler (development)
- **Supabase CLI**: Local development

## Application Structure

### Directory Layout
```
phoneguys-crm/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   ├── page.tsx       # Dashboard home
│   │   ├── orders/        # Order management
│   │   ├── appointments/  # Appointment system
│   │   ├── customers/     # Customer management
│   │   └── admin/         # Admin features
│   ├── auth/              # Authentication pages
│   └── api/               # REST API endpoints
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── orders/           # Order-specific
│   └── [feature]/        # Feature-specific
├── lib/                  # Core libraries
│   ├── repositories/     # Data access layer
│   ├── services/         # Business logic
│   ├── supabase/         # Supabase clients
│   ├── types/            # TypeScript types
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
└── docs/                 # Documentation
```

### Route Structure
- **Protected Routes**: `/(dashboard)/*` - Requires authentication
- **Public Routes**: `/auth/*` - Login, signup, password reset
- **API Routes**: `/api/*` - RESTful endpoints
- **Admin Routes**: `/admin/*` - Admin-only features

## Data Flow Patterns

### Server-Side Data Fetching (Current)
```typescript
// Server Component Pattern
async function OrdersPage() {
  const ticketRepo = new RepairTicketRepository(true);
  const tickets = await ticketRepo.findAllWithCustomers();
  return <OrdersClient orders={tickets} />;
}
```

### Client-Side Updates (Current Issue)
```typescript
// Client Component Anti-Pattern
function OrdersClient({ orders: initialOrders }) {
  const router = useRouter();
  
  // Problem: Full page refresh
  const handleUpdate = () => {
    router.refresh(); // ❌ Causes full page reload
  };
}
```

### Repository Pattern
```typescript
// Proper abstraction through BaseRepository
class BaseRepository<T> {
  protected async getClient() {
    if (this.useServiceRole) {
      return createServiceClient(); // Admin operations
    }
    return createClient(); // User operations
  }
}
```

## Authentication & Authorization

### Authentication Flow
1. **Middleware** (`middleware.ts`): Refreshes session on every request
2. **Cookie-based Sessions**: Managed by `@supabase/ssr`
3. **Protected Routes**: Redirect to `/auth/login` if unauthorized
4. **Auth Endpoints**:
   - `/auth/login` - User login
   - `/auth/sign-up` - Registration
   - `/auth/reset-password` - Password recovery
   - `/auth/update-password` - Password change

### Authorization System
- **Role-Based Access Control (RBAC)**:
  - `admin`: Full system access
  - `manager`: Management + reporting
  - `technician`: Basic CRUD + timer
- **30+ Granular Permissions** defined in `AuthorizationService`
- **Row Level Security**: Currently disabled for development

## Repository Pattern Implementation

### Base Repository (`base.repository.ts`)
- **Abstract class** with generic CRUD operations
- **Service Role Support**: Toggle between user/admin access
- **Error Handling**: Consistent error messages
- **Filter System**: Advanced query filtering
- **Pagination**: Built-in pagination support

### Specialized Repositories (12 total)
1. **RepairTicketRepository**: Order/ticket management
2. **CustomerRepository**: Customer data
3. **AppointmentRepository**: Appointment scheduling
4. **TimeEntryRepository**: Time tracking
5. **UserRepository**: User management
6. **DeviceRepository**: Device catalog
7. **CustomerDeviceRepository**: Customer devices
8. **ServiceRepository**: Repair services
9. **NotificationRepository**: Email notifications
10. **TicketNoteRepository**: Notes system
11. **Client Repositories**: Browser-safe versions

### Repository Features
- **UUID Cleanup**: Automatic empty UUID handling
- **Batch Operations**: `createMany`, `updateMany`, `deleteMany`
- **Existence Checks**: `exists()` method
- **Count Operations**: Efficient counting
- **Complex Joins**: Related data fetching

## Service Layer Architecture

### Service Classes (12 total)
1. **RepairOrderService**: Ticket business logic
2. **CustomerService**: Customer operations
3. **AppointmentService**: Appointment management
4. **TimerService**: Time tracking logic
5. **NotificationService**: Email handling
6. **AuthorizationService**: Permission checking
7. **ReportingService**: Analytics/reports
8. **UserService**: User management
9. **CustomerDeviceService**: Device management
10. **DeviceImageService**: Image handling
11. **TicketPhotoService**: Photo management
12. **ServiceService**: Repair service catalog

### Service Patterns
```typescript
// Service uses multiple repositories
class RepairOrderService {
  constructor(useServiceRole = false) {
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
    this.customerRepo = new CustomerRepository(useServiceRole);
    this.noteRepo = new TicketNoteRepository(useServiceRole);
  }
  
  // Orchestrates complex operations
  async createRepairOrder(data: CreateRepairTicketDto) {
    // Customer creation/lookup
    // Ticket creation
    // Note creation
    // Notification queuing
  }
}
```

## Client-Server Communication

### Current Implementation

#### Server Components (SSR)
- **Direct Repository Access**: Server components call repositories
- **Full Type Safety**: Types shared between server/client
- **No API Layer**: Direct database access
- **Props Drilling**: Data passed to client components

#### Client Components
- **Initial Props**: Receive data from server components
- **Router Refresh**: `router.refresh()` for updates (❌ Performance issue)
- **Server Actions**: Form submissions and mutations
- **Direct Supabase**: Some components bypass repositories (❌ Pattern violation)

### API Routes
- **External Integration**: `/api/repairs` for Astro website
- **Admin Operations**: `/api/admin/*` endpoints
- **File Uploads**: Image management endpoints
- **Authentication**: `/api/auth/*` for auth flows

## Real-Time Features

### Current Real-Time Implementation
```typescript
// Direct Supabase subscription (Pattern Violation)
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { 
      event: '*',
      schema: 'public',
      table: 'repair_tickets' 
    }, () => {
      router.refresh(); // ❌ Full page reload
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

### Real-Time Usage
- **Orders Page**: Listens to ticket and time entry changes
- **Appointments**: Updates on appointment changes
- **Dashboard**: Real-time metrics updates
- **Timer System**: Cross-tab synchronization

### Issues with Current Implementation
1. **Full Page Refreshes**: Every update triggers `router.refresh()`
2. **No Subscription Management**: Direct channel creation
3. **Memory Leaks**: Potential for unmanaged subscriptions
4. **Pattern Violations**: Direct Supabase calls in components

## Performance Characteristics

### Current Performance Metrics

#### Strengths
- **Fast Initial Load**: SSR provides quick first paint
- **SEO Friendly**: Server-rendered content
- **Type Safety**: Full TypeScript coverage
- **Code Splitting**: Automatic with App Router

#### Weaknesses
- **Navigation Speed**: Full page loads on route changes
- **Data Freshness**: Manual refresh required
- **Server Round Trips**: Every action hits server
- **Bundle Size**: No optimistic UI means larger payloads
- **User Experience**: Loading states disrupt flow

### Data Loading Patterns

#### Current Pattern (Synchronous)
```
User Action → Server Request → Database Query → Full Page Render
    ↑                                                    ↓
    └──────────── User Waits (1-3 seconds) ────────────┘
```

#### Optimized Pattern (Asynchronous)
```
User Action → Optimistic Update → Background Sync
    ↓              ↓                    ↓
Instant UI    Cache Update      Server Validation
```

## Architecture Strengths

### Well-Implemented Patterns
1. **Repository Pattern**: Clean data abstraction
2. **Service Layer**: Business logic separation
3. **Type Safety**: Comprehensive TypeScript usage
4. **Component Organization**: Clear feature separation
5. **Authentication**: Robust Supabase integration
6. **Error Handling**: Consistent error management
7. **Code Structure**: Clean, maintainable architecture

### Security Features
- **Row Level Security**: Database-level security (when enabled)
- **Role-Based Access**: Granular permissions
- **Input Validation**: Zod schemas throughout
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: React's built-in escaping

### Developer Experience
- **Hot Module Replacement**: Fast development
- **TypeScript IntelliSense**: Excellent IDE support
- **Clear File Structure**: Intuitive organization
- **Comprehensive Documentation**: Well-documented codebase

## Architecture Weaknesses

### Performance Issues

#### 1. Client State Management
- **No Caching Layer**: Every navigation fetches fresh data
- **No Query Deduplication**: Duplicate requests
- **Missing Prefetching**: No anticipatory data loading
- **No Background Updates**: Stale data between navigations

#### 2. Real-Time Implementation
- **Full Refreshes**: `router.refresh()` on every update
- **Inefficient Subscriptions**: Direct Supabase calls
- **No Selective Updates**: Entire page refreshes
- **Memory Management**: Potential subscription leaks

#### 3. User Experience
- **Loading Disruption**: Full page reloads
- **No Optimistic UI**: Wait for server confirmation
- **Missing Skeletons**: Basic "Loading..." text
- **Slow Perceived Performance**: 1-3 second delays

### Pattern Violations

#### Direct Supabase Calls (34 files)
```typescript
// ❌ Bad: Direct call in component
const supabase = createClient();
const { data } = await supabase.from('tickets').select();

// ✅ Good: Through repository
const ticketRepo = new RepairTicketRepository();
const data = await ticketRepo.findAll();
```

#### Router Refresh Anti-Pattern (19 occurrences)
```typescript
// ❌ Bad: Full page refresh
router.refresh();

// ✅ Good: Targeted cache invalidation (to be implemented)
queryClient.invalidateQueries(['tickets']);
```

### Scalability Concerns
1. **Server Load**: Every action requires server processing
2. **Database Connections**: No connection pooling optimization
3. **Bundle Size**: Will grow with more features
4. **State Management**: Becomes complex without proper solution

## Recommendations Summary

### Immediate Priorities
1. **Add TanStack Query**: Client-side caching layer
2. **Remove router.refresh()**: Replace with cache invalidation
3. **Centralize Subscriptions**: Create subscription service
4. **Add Loading Skeletons**: Improve perceived performance

### Long-Term Improvements
1. **Implement Offline Support**: Service workers
2. **Add Edge Caching**: CDN optimization
3. **Bundle Optimization**: Code splitting strategies
4. **Performance Monitoring**: Real user metrics

## Conclusion

The Phone Guys CRM has a solid architectural foundation with well-implemented patterns for data access and business logic. The main performance bottleneck is the lack of client-side state management, causing excessive server round trips and full page refreshes.

The repository and service patterns are well-designed and provide a clean abstraction layer. However, this good architecture is undermined by direct Supabase calls in client components and the widespread use of `router.refresh()`.

With the proposed optimizations, particularly adding TanStack Query and fixing the real-time implementation, the application can deliver a modern SPA experience while maintaining its current architectural strengths. The incremental approach ensures we can improve performance without disrupting the solid foundation already in place.

---

**Document Purpose**: This overview serves as the baseline for performance optimization efforts and should be updated as the architecture evolves.