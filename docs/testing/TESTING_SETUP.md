# 🛠️ Testing Infrastructure Setup

> **Setup Guide**: Step-by-step instructions to establish testing environment  
> **Current Status**: Setting up Jest + React Testing Library  
> **Target**: Ready to write and run tests

## 📦 Required Dependencies

### Install Testing Dependencies
```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  ts-jest \
  @types/jest
```

### Install Additional Testing Utilities
```bash
npm install --save-dev \
  msw \
  whatwg-fetch \
  @supabase/supabase-js
```

## 🔧 Configuration Files

### 1. Jest Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  moduleNameMapping: {
    // Handle module aliases (if you're using them in your Next.js app)
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### 2. Jest Setup File (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  })),
}))

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

// Global test timeout
jest.setTimeout(10000)
```

### 3. TypeScript Configuration for Tests (`tsconfig.json` update)
```json
{
  "compilerOptions": {
    // ... existing config
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": [
    // ... existing includes
    "**/*.test.ts",
    "**/*.test.tsx"
  ]
}
```

### 4. Package.json Scripts Update
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## 📁 Directory Structure

Create the following test directory structure:

```
tests/
├── __mocks__/                 # Global mocks
│   ├── supabase.ts           # Supabase client mock
│   └── next-router.ts        # Next.js router mock
├── fixtures/                 # Test data
│   ├── customers.ts          # Customer test data
│   ├── repair-tickets.ts     # Ticket test data
│   └── users.ts              # User test data
├── utils/                    # Test utilities
│   ├── test-utils.tsx        # Custom render with providers
│   ├── database.ts           # Database test helpers
│   └── auth.ts               # Authentication helpers
└── unit/                     # Unit tests
    ├── services/             # Service layer tests
    ├── repositories/         # Repository tests
    ├── hooks/               # React hook tests
    └── components/          # Component tests
```

## 🧪 Test Utilities

### 1. Custom Render Utility (`tests/utils/test-utils.tsx`)
```typescript
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### 2. Database Test Helpers (`tests/utils/database.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

// Create test Supabase client (local instance)
export const createTestClient = () => {
  return createClient(
    process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_TEST_ANON_KEY || 'test-key'
  )
}

// Clean test database
export const cleanDatabase = async (supabase: any) => {
  // Clean in reverse order of dependencies
  await supabase.from('time_entries').delete().gte('id', 0)
  await supabase.from('ticket_services').delete().gte('id', 0)
  await supabase.from('repair_tickets').delete().gte('id', 0)
  await supabase.from('customer_devices').delete().gte('id', 0)
  await supabase.from('customers').delete().gte('id', 0)
}

// Seed test data
export const seedTestData = async (supabase: any) => {
  // Add basic test data
  const { data: testCustomer } = await supabase
    .from('customers')
    .insert({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '555-1234'
    })
    .select()
    .single()

  return { testCustomer }
}
```

### 3. Test Data Fixtures (`tests/fixtures/repair-tickets.ts`)
```typescript
export const createTestTicket = (overrides: any = {}) => ({
  customer_id: 'test-customer-id',
  device_brand: 'Apple',
  device_model: 'iPhone 14',
  serial_number: 'ABC123',
  description: 'Screen replacement needed',
  status: 'new',
  priority: 'medium',
  estimated_cost: 150.00,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createTestCustomer = (overrides: any = {}) => ({
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '555-1234',
  address: '123 Test St, Test City',
  ...overrides
})
```

## 🚀 First Test Example

Create your first test to verify the setup works:

### `tests/unit/services/repair-ticket.service.test.ts`
```typescript
import { RepairTicketService } from '@/lib/services/repair-ticket.service'
import { createTestTicket } from '../../fixtures/repair-tickets'

describe('RepairTicketService', () => {
  let service: RepairTicketService

  beforeEach(() => {
    service = new RepairTicketService()
  })

  describe('Basic Setup Test', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined()
    })

    it('should have required methods', () => {
      expect(typeof service.createTicket).toBe('function')
      expect(typeof service.updateTicket).toBe('function')
      expect(typeof service.getTicket).toBe('function')
    })
  })

  // Add more tests as we implement them
})
```

## ✅ Setup Verification

After completing the setup, verify everything works:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Your First Test
```bash
npm test
```

### 3. Check Coverage Report
```bash
npm run test:coverage
```

### 4. Expected Output
You should see:
- Jest test runner starts
- Tests discover and run
- Coverage report shows current state
- No major errors in setup

## 🔧 Troubleshooting

### Common Issues:

#### "Module not found" errors
- Check `moduleNameMapping` in `jest.config.js`
- Verify path aliases match your project structure

#### "window is not defined" errors
- Ensure `testEnvironment: 'jest-environment-jsdom'` is set
- Mock browser-specific APIs if needed

#### Supabase connection errors
- Verify local Supabase is running: `npx supabase status`
- Check environment variables in test setup

#### React Query errors
- Ensure providers are properly mocked in test utils
- Wrap components with QueryClient in tests

## 📝 Next Steps

Once setup is complete:

1. ✅ Verify all tests pass
2. ✅ Check coverage baseline (should show current 22%)
3. ✅ Create first real test for RepairTicketService
4. ✅ Start building comprehensive test suite

The testing infrastructure is now ready for development!