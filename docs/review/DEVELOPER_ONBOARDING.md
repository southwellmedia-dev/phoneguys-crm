# 🚀 Developer Onboarding Guide - The Phone Guys CRM

> **Welcome to The Phone Guys CRM Development Team!**  
> **Time to Productivity**: 2-3 days  
> **Last Updated**: January 2025

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Overview](#system-overview)
3. [Development Setup](#development-setup)
4. [Architecture Primer](#architecture-primer)
5. [Key Concepts](#key-concepts)
6. [Common Tasks](#common-tasks)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## Quick Start

### Day 1: Environment Setup (2-3 hours)

```bash
# 1. Clone the repository
git clone [repository-url]
cd phoneguys-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.development .env.local

# 4. Start local Supabase
npx supabase start

# 5. Seed the database
npx supabase db reset

# 6. Start development server
npm run dev

# 7. Access the application
# App: http://localhost:3000
# Login: admin@phoneguys.com / admin123456
# Supabase Studio: http://127.0.0.1:54323
```

### Day 1: First Code Change (1 hour)

Let's make a simple change to understand the workflow:

1. **Find the Dashboard**: `app/(dashboard)/page.tsx`
2. **Modify Welcome Message**: Change the greeting text
3. **See Hot Reload**: Save and watch the browser update
4. **Check Real-time**: Open two browsers, make a change in one
5. **Explore Component Showcase**: Visit http://localhost:3000/showcase to see all available components

### Day 2: Understand the Architecture (4-6 hours)

**Essential Reading:**
1. 📖 [CLAUDE.md](../CLAUDE.md) - Quick reference guide (30 min)
2. 📖 [ARCHITECTURE_COMPLETE.md](./ARCHITECTURE_COMPLETE.md) - System architecture (1 hour)
3. 📖 [FEATURE_DEVELOPMENT_GUIDE.md](../features/FEATURE_DEVELOPMENT_GUIDE.md) - How to build features (1 hour)
4. 🎨 [Premium Component Library](../../components/premium/README.md) - Our design system & UI components (45 min)
5. 💧 [Hydration Strategy](../components/HYDRATION_STRATEGY.md) - SSR & client-side data loading patterns (30 min)

**Code Exploration:**
1. Browse `/lib/repositories` - Data access layer
2. Explore `/lib/services` - Business logic
3. Review `/lib/hooks` - React Query hooks
4. Check `/components/premium` - Premium UI component library
5. Study `/components/premium/connected` - Data-aware components

### Day 3: Build Your First Feature (Full day)

Follow the [Feature Development Guide](./features/FEATURE_DEVELOPMENT_GUIDE.md) to build a small feature.

---

## System Overview

### What is The Phone Guys CRM?

A comprehensive repair management system for a mobile device repair service. It handles:
- 📱 Device repair tracking from intake to completion
- 👥 Customer relationship management
- 📅 Appointment scheduling
- ⏱️ Time tracking and billing
- 👨‍💼 Staff management
- 📊 Analytics and reporting

### Tech Stack at a Glance

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React 19 | UI framework |
| **Styling** | Tailwind CSS, shadcn/ui | Design system |
| **State** | TanStack Query v5 | Server state management |
| **Backend** | Supabase | Database, Auth, Real-time |
| **Language** | TypeScript | Type safety |
| **Dev Tools** | Turbopack, ESLint | Development experience |

---

## Development Setup

### Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **npm**: v9+ (check with `npm --version`)
- **Git**: Latest version
- **VS Code**: Recommended editor
- **Docker**: For Supabase local development

### VS Code Extensions

Install these for the best experience:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Environment Variables

```bash
# .env.local.development (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[local-anon-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.local.production (Production - Testing Only)
NEXT_PUBLIC_SUPABASE_URL=https://egotypldqzdzjclikmeg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
```

### Database Access

```bash
# Local Supabase URLs
Studio: http://127.0.0.1:54323      # Database UI
API: http://127.0.0.1:54321         # REST API
Inbucket: http://127.0.0.1:54324    # Email testing

# Production (be careful!)
Project: https://supabase.com/dashboard/project/egotypldqzdzjclikmeg
```

---

## Architecture Primer

### The Repository Pattern

We use repositories to abstract database operations:

```typescript
// ❌ Don't do this (direct Supabase calls)
const { data } = await supabase
  .from('repair_tickets')
  .select('*')
  .eq('status', 'new');

// ✅ Do this (use repository)
const ticketRepo = getRepository.tickets();
const tickets = await ticketRepo.findByStatus('new');
```

### The Service Layer

Services contain business logic:

```typescript
// ❌ Don't put business logic in components
const handleCreateOrder = async () => {
  // Complex logic here...
};

// ✅ Use service layer
const orderService = new RepairOrderService();
const order = await orderService.createRepairOrder(data);
```

### React Query for State

We use React Query for server state management:

```typescript
// ✅ Use our custom hooks
const { data: tickets, isLoading } = useTickets();

// The hook handles:
// - Caching
// - Background refetching
// - Optimistic updates
// - Real-time subscriptions
```

### Real-time Updates

Never use `router.refresh()` or `invalidateQueries` for real-time:

```typescript
// ❌ Wrong - causes refetch
onUpdate: () => {
  queryClient.invalidateQueries(['tickets']);
}

// ✅ Correct - direct cache update
onUpdate: (payload) => {
  queryClient.setQueryData(['tickets'], old => 
    old.map(t => t.id === payload.new.id ? payload.new : t)
  );
}
```

---

## Key Concepts

### 1. Data Flow

```
User Action → Component → Hook → API/Service → Repository → Database
                ↑                                    ↓
                └── React Query Cache ← Real-time Updates
```

### 2. File Structure

```
app/                    # Pages (Next.js App Router)
├── (dashboard)/       # Protected pages
├── admin/            # Admin-only pages
├── api/              # API endpoints
└── auth/             # Auth pages

components/            # React components
├── orders/           # Feature components
├── premium/          # Premium UI components
└── ui/              # Base UI (shadcn)

lib/                   # Core logic
├── hooks/            # React Query hooks
├── repositories/     # Data access
├── services/         # Business logic
├── types/           # TypeScript types
└── utils/           # Utilities
```

### 3. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `OrderDetail.tsx` |
| **Hooks** | camelCase with 'use' | `useTickets.ts` |
| **Services** | PascalCase + 'Service' | `RepairOrderService.ts` |
| **Repositories** | PascalCase + 'Repository' | `CustomerRepository.ts` |
| **API Routes** | kebab-case | `/api/repair-tickets` |
| **Database** | snake_case | `repair_tickets` |

### 4. Component Patterns

```typescript
// Server Component (default)
export default async function OrdersPage() {
  // Can fetch data directly
  const orders = await getOrders();
  return <OrdersList orders={orders} />;
}

// Client Component (interactive)
'use client';
export function OrdersList({ orders }) {
  const [selected, setSelected] = useState();
  // Interactive logic here
}
```

### 5. Premium Component Library

Our custom design system provides 60+ production-ready components:

```typescript
import { 
  ButtonPremium,      // Enhanced buttons with 15+ variants
  MetricCard,         // Fintech-style metric displays
  StatusBadge,        // Consistent status indicators
  TablePremium        // Advanced data tables
} from '@/components/premium';

// Example usage
<ButtonPremium variant="gradient" size="lg">
  Create Order
</ButtonPremium>

<MetricCard
  title="Total Revenue"
  value="$12,345"
  change={15.3}
  trend="up"
  variant="inverted-primary"  // Solid cyan background
/>
```

**Key Features:**
- **70% Complete**: 43 of 61 components built
- **Fintech Design**: Clean, professional aesthetic like Stripe/Linear
- **Brand Colors**: Cyan (#0094CA) and Red (#fb2c36)
- **Connected Components**: Data-aware with real-time updates
- **Interactive Showcase**: Visit `/showcase` in the app to explore all components
- **Full Documentation**: See [Premium Component Library README](../../components/premium/README.md)

**Component Showcase:**
Access the interactive component showcase at http://localhost:3000/showcase to:
- View all available components organized by category
- See live examples with different variants and props
- Copy code snippets for quick implementation
- Test component interactions and animations
- Categories include: Buttons, Cards, Badges, Feedback, Tables, Navigation

### 6. Hydration Strategy for Connected Components

Our connected components use a smart hydration pattern to prevent loading flashes:

```typescript
// The hasLoadedOnce pattern prevents "flash of no data"
export function useExampleData() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['example'],
    queryFn: fetchExample,
    enabled: isMounted,  // Only fetch after client mount
    staleTime: 5 * 60 * 1000,
    placeholderData: { value: 0 }  // Provide structure
  });

  // Track when data has loaded successfully
  useEffect(() => {
    if (query.isSuccess && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [query.isSuccess, hasLoadedOnce]);

  return {
    ...query,
    // Show skeleton until we definitively know data state
    showSkeleton: !hasLoadedOnce || query.isLoading || query.isFetching
  };
}
```

**Key Principles:**
- **Structure First**: Component structure renders immediately
- **Progressive Enhancement**: Data loads after hydration
- **Zero Layout Shift**: No jumping content
- **Internal Skeletons**: Not container skeletons
- **Full Guide**: See [Hydration Strategy](../components/HYDRATION_STRATEGY.md)

---

## Common Tasks

### Creating a New Feature

```bash
# 1. Create migration
npx supabase migration new your_feature_name

# 2. Edit migration file in supabase/migrations/

# 3. Apply migration
npx supabase db reset

# 4. Generate types
npm run generate:types

# 5. Create repository, service, hook, component
# Follow the Feature Development Guide
```

### Adding an API Endpoint

```typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  // 1. Check authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // 2. Use repository/service
  const service = new YourService();
  const data = await service.getData();

  // 3. Return response
  return NextResponse.json({ data });
}
```

### Creating a React Query Hook

```typescript
// lib/hooks/use-your-feature.ts
export function useYourFeature() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const query = useQuery({
    queryKey: ['your-feature'],
    queryFn: fetchYourData,
    enabled: isMounted, // Only fetch after mount
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add real-time subscription
  useRealtime(['your-feature']);

  return query;
}
```

### Working with Forms

```typescript
// Use React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema } from '@/lib/validations/order';

const form = useForm({
  resolver: zodResolver(orderSchema),
  defaultValues: { /* ... */ }
});
```

---

## Best Practices

### ✅ DO

1. **Use the Repository Pattern**
   ```typescript
   const repo = getRepository.tickets();
   const tickets = await repo.findAll();
   ```

2. **Implement Optimistic Updates**
   ```typescript
   onMutate: async (newData) => {
     await queryClient.cancelQueries(['key']);
     const previous = queryClient.getQueryData(['key']);
     queryClient.setQueryData(['key'], newData);
     return { previous };
   }
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     const result = await operation();
     toast.success('Success!');
   } catch (error) {
     toast.error('Something went wrong');
     console.error(error);
   }
   ```

4. **Use TypeScript Strictly**
   ```typescript
   // Avoid 'any' types
   interface UserData {
     id: string;
     name: string;
     // ... full typing
   }
   ```

### ❌ DON'T

1. **Never use `router.refresh()`**
   ```typescript
   // This reloads the entire page!
   router.refresh(); // ❌ NEVER DO THIS
   ```

2. **Don't bypass the service layer**
   ```typescript
   // Don't put business logic in components
   // Use services for complex operations
   ```

3. **Avoid direct Supabase calls**
   ```typescript
   // Use repositories instead of direct calls
   // This maintains consistency
   ```

4. **Don't ignore TypeScript errors**
   ```typescript
   // Fix type errors, don't use @ts-ignore
   ```

---

## Troubleshooting

### Common Issues

#### 1. Supabase Won't Start
```bash
# Stop all containers
docker ps -q | xargs docker stop
# or
npx supabase stop

# Start fresh
npx supabase start
```

#### 2. Type Errors After Database Changes
```bash
# Regenerate types
npm run generate:types
```

#### 3. Real-time Updates Not Working
```typescript
// Check if you're subscribed
useRealtime(['correct-channel']);

// Verify you're using setQueryData, not invalidateQueries
```

#### 4. Authentication Issues
```bash
# Check your environment variables
# Make sure you're using the right .env.local file
```

#### 5. Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Debug Commands

```bash
# Check Supabase status
npx supabase status

# View logs
npx supabase logs

# Reset database
npx supabase db reset

# Check TypeScript
npx tsc --noEmit

# Lint code
npm run lint
```

---

## Resources

### Essential Documentation

1. **Project Docs**
   - [ARCHITECTURE_COMPLETE.md](./ARCHITECTURE_COMPLETE.md) - System architecture
   - [FEATURE_COMPLIANCE_MATRIX.md](./FEATURE_COMPLIANCE_MATRIX.md) - Feature status
   - [CLAUDE.md](../CLAUDE.md) - Quick reference

2. **Component & Design System**
   - [Premium Component Library](../../components/premium/README.md) - 60+ UI components & design system
   - [HYDRATION_STRATEGY.md](../components/HYDRATION_STRATEGY.md) - SSR/Hydration patterns
   - [CONNECTED_COMPONENTS_GUIDE.md](../components/CONNECTED_COMPONENTS_GUIDE.md) - Data-aware components

3. **Feature Guides**
   - [FEATURE_DEVELOPMENT_GUIDE.md](../features/FEATURE_DEVELOPMENT_GUIDE.md) - Building features
   - [Repair Order Review](./features/REPAIR_ORDER_MANAGEMENT_REVIEW.md) - Example feature analysis
   - [Customer Management Review](./features/CUSTOMER_MANAGEMENT_REVIEW.md) - Feature patterns

4. **External Resources**
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [TanStack Query Docs](https://tanstack.com/query)
   - [Tailwind CSS Docs](https://tailwindcss.com/docs)
   - [shadcn/ui Docs](https://ui.shadcn.com)

### Getting Help

1. **Check Documentation First**
   - Most answers are in the docs
   - Use search in VS Code: `Ctrl+Shift+F`

2. **Code Examples**
   - **Component Showcase**: Visit http://localhost:3000/showcase for interactive component examples
   - Look at existing features for patterns
   - `RepairOrderService` is a good reference
   - `useTickets` hook shows best practices
   - `/app/(dashboard)/showcase/components/` contains showcase implementations

3. **Team Communication**
   - Create detailed issues in GitHub
   - Include error messages and context
   - Tag relevant team members

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# Follow the patterns!

# 3. Test locally
npm run dev
# Test with multiple users for real-time

# 4. Check types and lint
npx tsc --noEmit
npm run lint

# 5. Commit with clear message
git add .
git commit -m "feat: add your feature description"

# 6. Push and create PR
git push origin feature/your-feature
```

---

## Your First Week Checklist

### Day 1
- [ ] Set up development environment
- [ ] Access application locally
- [ ] Make first code change
- [ ] Explore Component Showcase (/showcase)
- [ ] Understand project structure

### Day 2
- [ ] Read architecture documentation
- [ ] Review Premium Component Library
- [ ] Understand hydration strategy
- [ ] Explore codebase
- [ ] Understand data flow
- [ ] Review existing features

### Day 3
- [ ] Start building first feature
- [ ] Follow Feature Development Guide
- [ ] Test with real-time updates
- [ ] Create first pull request

### Day 4-5
- [ ] Complete first feature
- [ ] Review code patterns
- [ ] Fix any issues
- [ ] Document your work

### End of Week 1
- [ ] Comfortable with architecture
- [ ] Can build features independently
- [ ] Understand best practices
- [ ] Ready for larger tasks

---

## Pro Tips

1. **Use the Component Showcase**
   - Visit http://localhost:3000/showcase to explore all components
   - Test different variants and props interactively
   - Copy code snippets directly from examples
   - Use it as a reference when building new features

2. **Use the Repository Manager**
   ```typescript
   // Singleton pattern for better performance
   const repo = getRepository.tickets();
   ```

3. **Test Real-time with Multiple Tabs**
   - Open multiple browser tabs
   - Make changes in one
   - Watch updates in others

4. **Use Seed Data**
   ```bash
   # Reset with fresh test data
   npx supabase db reset
   ```

5. **Enable React Query Devtools**
   ```typescript
   // In development, see query states
   // Look for the floating button
   ```

6. **Learn Keyboard Shortcuts**
   - `Cmd/Ctrl + P`: Quick file open
   - `Cmd/Ctrl + Shift + F`: Search project
   - `Cmd/Ctrl + .`: Quick fix

---

## Welcome Aboard! 🎉

You're now ready to start contributing to The Phone Guys CRM. Remember:

- **Follow the patterns** - Consistency is key
- **Ask questions** - Better to ask than assume
- **Test thoroughly** - Especially real-time features
- **Document your work** - Help the next developer

Happy coding! 🚀

---

*Last updated: January 2025 | Questions? Check [ARCHITECTURE_COMPLETE.md](./ARCHITECTURE_COMPLETE.md) or ask the team*