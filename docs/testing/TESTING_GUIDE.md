# 🧪 Testing Guide - The Phone Guys CRM

> **Created**: January 2025  
> **Current Coverage**: 22% → Target: 40% (Critical Paths)  
> **Status**: ACTIVE DEVELOPMENT  
> **Priority**: HIGH (Critical system stability)

## 📊 Testing Status Overview

### Current State
- **Test Coverage**: 22% (critically low)
- **Framework**: Jest + React Testing Library (configured)
- **Database**: Supabase (local test environment available)
- **Priority**: Critical path testing to prevent production failures

### Target Goals
- **Phase 1**: 22% → 40% (Critical paths covered)
- **Phase 2**: 40% → 60% (Comprehensive coverage)
- **Phase 3**: 60% → 80% (Production-ready)

---

## 🎯 Testing Priorities (Ordered by Business Impact)

### 🔴 **CRITICAL PRIORITY** - Week 1

#### 1. Repair Order Workflow Tests
**Impact**: Core revenue-generating functionality  
**Risk**: Order processing failures = lost revenue
**Files**: `lib/services/repair-ticket.service.ts`, `lib/repositories/repair-ticket.repository.ts`

**Test Coverage Needed**:
- [ ] Create new repair order
- [ ] Update order status (new → in_progress → completed)
- [ ] Add/remove services to order
- [ ] Calculate total cost with services
- [ ] Timer start/stop/calculation
- [ ] Generate invoice from completed order
- [ ] Cancel order and handle refunds
- [ ] Real-time updates across clients

#### 2. Authentication Flow Tests  
**Impact**: Security and access control
**Risk**: Security vulnerabilities, unauthorized access
**Files**: `lib/auth/helpers.ts`, `lib/services/authorization.service.ts`

**Test Coverage Needed**:
- [ ] User login with valid credentials
- [ ] User login with invalid credentials  
- [ ] Password reset flow
- [ ] Session validation and expiry
- [ ] Role-based authorization (admin vs user vs technician)
- [ ] Protected route access
- [ ] JWT token handling

#### 3. Timer System Tests
**Impact**: Billing accuracy and time tracking
**Risk**: Incorrect billing, lost time entries
**Files**: `lib/services/timer.service.ts`, timer components

**Test Coverage Needed**:
- [ ] Start timer for repair ticket
- [ ] Stop timer and calculate duration  
- [ ] Cross-tab timer synchronization
- [ ] Timer recovery after browser refresh
- [ ] Multiple timers handling
- [ ] Billing calculation accuracy
- [ ] Time entry creation and storage

---

## 🛠️ Testing Framework & Setup

### Tech Stack
```json
{
  "testing": {
    "framework": "Jest",
    "react": "React Testing Library",
    "database": "Supabase Local",
    "mocking": "MSW (Mock Service Worker)",
    "coverage": "Jest Coverage Reports"
  }
}
```

### Project Structure
```
/tests/
  ├── __mocks__/           # Global mocks
  ├── utils/               # Test utilities
  ├── fixtures/            # Test data
  ├── integration/         # Integration tests
  └── unit/               # Unit tests
    ├── services/         # Service layer tests
    ├── repositories/     # Data layer tests  
    ├── hooks/           # React hook tests
    └── components/      # Component tests
```

### Environment Setup
```bash
# Run tests locally
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test repair-ticket.service.test.ts

# Run tests in watch mode
npm test -- --watch

# Start Supabase for integration tests
npx supabase start
```

---

## 🏗️ Architecture-First Testing Strategy

**CRITICAL**: Our tests must validate our core architectural principles:

1. **Smart Hydration Strategy** - Structure first, progressive data loading without layout shifts
2. **Real-time Updates** - Direct cache updates via `setQueryData`, never `invalidateQueries`
3. **Repository Pattern** - All database operations abstracted through repositories
4. **Optimistic Updates** - Immediate UI feedback with proper rollback on errors

📖 **See [ARCHITECTURE_AWARE_TESTING.md](./ARCHITECTURE_AWARE_TESTING.md)** for comprehensive implementation patterns and test utilities.

### Key Testing Principles

1. **Test Behavior, Not Implementation** - Focus on user-visible outcomes
2. **Validate Architecture Compliance** - Ensure patterns are followed correctly
3. **Real-time Performance** - No unnecessary refetches or cache invalidations
4. **Zero Layout Shifts** - Components maintain structure during loading states

---

## 📝 Test Writing Guidelines

### 1. **Test File Naming Convention**
```
Original File: lib/services/repair-ticket.service.ts
Test File:     tests/unit/services/repair-ticket.service.test.ts

Original File: lib/hooks/use-tickets.ts  
Test File:     tests/unit/hooks/use-tickets.test.ts

Connected Component: components/premium/connected/metric-card-live.tsx
Test File:           tests/unit/components/metric-card-live.hydration.test.ts
```

### 2. **Test Structure Pattern**
```typescript
describe('RepairTicketService', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear database
  });

  describe('createTicket', () => {
    it('should create ticket with valid data', async () => {
      // Arrange
      const ticketData = createTestTicketData();
      
      // Act
      const result = await service.createTicket(ticketData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('new');
    });

    it('should throw error with invalid data', async () => {
      // Arrange
      const invalidData = {};
      
      // Act & Assert
      await expect(service.createTicket(invalidData))
        .rejects.toThrow('Invalid ticket data');
    });
  });
});
```

### 3. **Database Testing Strategy**
```typescript
// Use real Supabase local instance for integration tests
const supabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
);

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase(supabase);
  await seedTestData(supabase);
});
```

### 4. **Mocking Guidelines**
```typescript
// Mock external services, not business logic
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock timers for time-dependent tests
jest.useFakeTimers();
```

---

## 🧩 Test Utilities & Helpers

### Database Utilities
```typescript
// tests/utils/database.ts
export const cleanDatabase = async (supabase) => {
  await supabase.from('repair_tickets').delete().gte('id', 0);
  await supabase.from('customers').delete().gte('id', 0);
};

export const seedTestData = async (supabase) => {
  const testCustomer = await supabase.from('customers')
    .insert(createTestCustomer()).select().single();
  return { testCustomer };
};
```

### Test Data Factories
```typescript
// tests/fixtures/repair-ticket.fixtures.ts
export const createTestTicket = (overrides = {}) => ({
  customer_id: '123',
  device_brand: 'Apple',
  device_model: 'iPhone 14',
  description: 'Screen replacement',
  status: 'new',
  priority: 'medium',
  ...overrides
});

export const createTestCustomer = (overrides = {}) => ({
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '555-1234',
  ...overrides
});
```

### Authentication Test Helpers
```typescript
// tests/utils/auth.ts
export const createAuthenticatedUser = (role = 'user') => {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role,
    app_metadata: { role }
  };
};

export const mockAuthContext = (user) => {
  return {
    user,
    session: { user },
    loading: false
  };
};
```

---

## 🚀 Getting Started Checklist

### For New Developers/Agents
- [ ] Read this testing guide completely
- [ ] Understand current test coverage (22%)
- [ ] Set up local Supabase testing environment
- [ ] Run existing tests: `npm test`
- [ ] Check test coverage: `npm run test:coverage`
- [ ] Review existing test files in `/tests` folder
- [ ] Start with repair order workflow tests (highest priority)

### Before Writing Tests
- [ ] Identify the critical path being tested
- [ ] Understand the business logic and edge cases
- [ ] Check if test utilities exist for the component/service
- [ ] Write test plan with specific scenarios
- [ ] Set up proper mocks and test data

### After Writing Tests
- [ ] Ensure tests pass consistently
- [ ] Check that coverage increased meaningfully
- [ ] Verify tests catch real bugs (intentionally break code)
- [ ] Update this guide with new patterns/utilities
- [ ] Document any complex test scenarios

---

## 📈 Test Coverage Tracking

### Current Coverage by Module
```
📊 Coverage Report (Last Updated: January 2025)

Overall: 22% (Target: 40%)

Core Services:
- repair-ticket.service.ts: 0% ❌
- customer.service.ts: 5% ❌  
- timer.service.ts: 0% ❌
- auth/helpers.ts: 15% ❌

Repositories:
- repair-ticket.repository.ts: 0% ❌
- customer.repository.ts: 10% ❌

Hooks:
- use-tickets.ts: 0% ❌
- use-customers.ts: 5% ❌
- use-auth.ts: 20% ⚠️

Components:
- OrderDetailClient: 0% ❌
- CustomersTable: 5% ❌
```

### Coverage Goals by Priority
```
Week 1 Targets:
✅ Repair Order Workflow: 0% → 80%
✅ Authentication Flow: 15% → 75% 
✅ Timer System: 0% → 70%
🎯 Overall: 22% → 40%

Week 2 Targets:  
✅ Customer Management: 10% → 70%
✅ Appointment System: 5% → 60%
✅ Real-time Updates: 0% → 50%
🎯 Overall: 40% → 60%
```

---

## ⚠️ Common Testing Challenges & Solutions

### 1. **Supabase Mocking**
**Challenge**: Real-time subscriptions and complex queries  
**Solution**: Use local Supabase instance + MSW for external calls

### 2. **Timer Testing** 
**Challenge**: Time-dependent functionality
**Solution**: Mock system time with Jest fake timers

### 3. **Real-time Testing**
**Challenge**: WebSocket connections and cache updates
**Solution**: Mock RealtimeService, test cache updates directly

### 4. **Authentication Context**
**Challenge**: React context and session management
**Solution**: Custom test wrapper with auth provider

### 5. **Database State**
**Challenge**: Test isolation and cleanup  
**Solution**: Transaction rollback or targeted cleanup functions

---

## 🔍 Test Quality Standards

### ✅ Good Test Characteristics
- **Fast**: Run in milliseconds, not seconds
- **Independent**: Don't depend on other tests  
- **Repeatable**: Same result every time
- **Self-validating**: Clear pass/fail
- **Comprehensive**: Cover happy path + edge cases

### ❌ Avoid These Anti-patterns
- Testing implementation details instead of behavior
- Over-mocking business logic
- Fragile tests that break with UI changes
- Tests that don't actually test anything
- Slow integration tests for unit test scenarios

---

## 📚 Resources & References

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/local-development)

### Internal Resources
- `/docs/PROJECT_MASTER.md` - Project overview and architecture
- `/docs/DEVELOPMENT_GUIDELINES.md` - Coding standards
- `/.env.local.development` - Test environment configuration  
- `/supabase/seed.sql` - Test data setup

### Test Categories by Architecture Layer

```
tests/
├── unit/
│   ├── services/           # Business logic tests
│   ├── repositories/       # Database layer tests  
│   ├── hooks/             # React Query hook tests
│   └── components/        # Component behavior tests
├── integration/
│   ├── workflows/         # End-to-end business workflows
│   ├── realtime/         # Multi-user real-time scenarios
│   └── hydration/        # SSR/client hydration flows
├── compliance/
│   ├── architecture/     # Architecture pattern enforcement
│   ├── performance/      # Real-time performance validation
│   └── patterns/        # Code pattern compliance checks
└── utils/
    ├── hydration-test-utils.tsx    # Hydration testing helpers
    ├── realtime-test-utils.tsx     # Real-time testing helpers
    └── repository-test-utils.ts    # Database testing helpers
```

### Architecture-Specific Test Types

1. **Hydration Tests** - Validate `hasLoadedOnce` pattern and progressive loading
2. **Real-time Tests** - Ensure cache updates, never invalidation
3. **Repository Tests** - Database abstraction and business logic separation  
4. **Service Tests** - Business rules and workflow validation
5. **Integration Tests** - Complete user workflows with real-time sync

---

## 🚨 Emergency Testing Procedures

### If Tests Are Failing in CI/CD
1. **Check environment variables** - Test DB connection
2. **Verify Supabase local** is running
3. **Clear node_modules** and reinstall
4. **Check for async timing issues** - add proper awaits
5. **Review recent code changes** - did business logic change?

### If Coverage Drops Below Target
1. **Identify uncovered critical paths** - run coverage report
2. **Add tests for new features** - don't merge without tests  
3. **Refactor complex functions** - make them testable
4. **Document testing debt** - create issues for later

---

## 📋 Testing Checklist Template

Copy this for each testing session:

```markdown
## Testing Session: [Date]

### Pre-Session Checklist
- [ ] Current test coverage: __%
- [ ] Supabase local running
- [ ] All existing tests passing
- [ ] Target module identified: ________

### Session Goals
- [ ] Test scenario 1: ________
- [ ] Test scenario 2: ________ 
- [ ] Test scenario 3: ________
- [ ] Target coverage increase: __% → __%

### Architecture Compliance Tests
- [ ] Hydration pattern validation (hasLoadedOnce, progressive loading)
- [ ] Real-time updates use setQueryData (never invalidateQueries)
- [ ] Repository pattern usage (no direct Supabase in components)
- [ ] Optimistic updates with proper rollback

### Post-Session Checklist
- [ ] All tests passing
- [ ] Coverage increased by __%
- [ ] Documentation updated
- [ ] Test utilities created/improved
- [ ] Edge cases identified and tested

### Next Session Priority
- [ ] Continue with: ________
- [ ] New module: ________
```

---

## 🎯 Success Metrics

We'll know testing is successful when:

✅ **Coverage**: 22% → 40% → 60% → 80%  
✅ **Confidence**: Can deploy changes without fear  
✅ **Speed**: Catch bugs in development, not production  
✅ **Quality**: New features always include tests  
✅ **Onboarding**: New developers understand system via tests  

**Remember**: Tests are an investment in system reliability and developer productivity. Every hour spent writing tests saves multiple hours debugging production issues.

---

*This guide is a living document. Update it as we learn better testing patterns and face new challenges.*