# 🧪 First Test Example - Architecture Compliant

> **Purpose**: A practical example demonstrating how to write tests that validate our core architectural principles  
> **Target**: RepairTicketService - Core business logic  
> **Principles**: Repository pattern, business logic validation, error handling

## 🎯 What We're Testing

This example tests the `RepairTicketService.createTicket()` method to demonstrate:

1. **Repository Pattern Usage** - Service uses repository, not direct DB calls
2. **Business Logic Validation** - Proper validation and error handling
3. **Data Transformation** - Service layer transforms data correctly
4. **Error Propagation** - Errors are handled and propagated properly

---

## 📁 Test File Structure

```
tests/
├── unit/
│   └── services/
│       └── repair-ticket.service.test.ts
├── utils/
│   ├── test-data-factory.ts
│   └── mock-repository.ts
└── fixtures/
    └── repair-ticket.fixtures.ts
```

---

## 🔧 Test Implementation

### 1. Test Data Factory

```typescript
// tests/fixtures/repair-ticket.fixtures.ts
export const createTestTicketData = (overrides: any = {}) => ({
  customer_id: 'test-customer-id',
  device_brand: 'Apple',
  device_model: 'iPhone 14',
  serial_number: 'ABC123XYZ',
  imei: '123456789012345',
  repair_issues: ['cracked_screen', 'battery_replacement'],
  description: 'Phone dropped, screen cracked and battery draining quickly',
  priority: 'medium' as const,
  estimated_cost: 250.00,
  deposit_amount: 50.00,
  ...overrides
})

export const createTestCustomer = (overrides: any = {}) => ({
  id: 'test-customer-id',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  address: '123 Main St, Anytown USA',
  ...overrides
})

export const createExpectedTicketResponse = (inputData: any) => ({
  id: expect.any(String),
  ticket_number: expect.stringMatching(/^T\d{6}$/),
  status: 'new',
  created_at: expect.any(String),
  updated_at: expect.any(String),
  ...inputData
})
```

### 2. Mock Repository Setup

```typescript
// tests/utils/mock-repository.ts
export class MockRepairTicketRepository {
  private mockData: Map<string, any> = new Map()
  
  create = jest.fn(async (data: any) => {
    const id = `ticket-${Date.now()}`
    const ticket = {
      id,
      ticket_number: `T${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    }
    this.mockData.set(id, ticket)
    return ticket
  })
  
  findById = jest.fn(async (id: string) => {
    return this.mockData.get(id) || null
  })
  
  findByCustomer = jest.fn(async (customerId: string) => {
    return Array.from(this.mockData.values())
      .filter(ticket => ticket.customer_id === customerId)
  })
  
  // Mock implementation that can fail for testing
  mockCreateFailure(error: Error) {
    this.create.mockRejectedValueOnce(error)
  }
  
  // Reset all mocks
  reset() {
    this.mockData.clear()
    jest.clearAllMocks()
  }
}

export class MockCustomerRepository {
  findById = jest.fn(async (id: string) => {
    if (id === 'test-customer-id') {
      return createTestCustomer({ id })
    }
    return null
  })
}
```

### 3. Service Layer Test

```typescript
// tests/unit/services/repair-ticket.service.test.ts
import { RepairTicketService } from '@/lib/services/repair-ticket.service'
import { MockRepairTicketRepository, MockCustomerRepository } from '../../utils/mock-repository'
import { createTestTicketData, createTestCustomer, createExpectedTicketResponse } from '../../fixtures/repair-ticket.fixtures'

// Mock the repository manager to return our mocks
jest.mock('@/lib/repositories/repository-manager', () => ({
  getRepository: {
    tickets: jest.fn(),
    customers: jest.fn()
  }
}))

describe('RepairTicketService', () => {
  let service: RepairTicketService
  let mockTicketRepo: MockRepairTicketRepository
  let mockCustomerRepo: MockCustomerRepository
  
  beforeEach(() => {
    // Reset mocks
    mockTicketRepo = new MockRepairTicketRepository()
    mockCustomerRepo = new MockCustomerRepository()
    
    // Configure repository manager to return our mocks
    const { getRepository } = require('@/lib/repositories/repository-manager')
    getRepository.tickets.mockReturnValue(mockTicketRepo)
    getRepository.customers.mockReturnValue(mockCustomerRepo)
    
    // Create service instance
    service = new RepairTicketService()
  })
  
  afterEach(() => {
    mockTicketRepo.reset()
    jest.clearAllMocks()
  })

  describe('Architecture Compliance', () => {
    it('uses repository pattern correctly', async () => {
      const ticketData = createTestTicketData()
      
      await service.createTicket(ticketData, 'test-user-id')
      
      // Should use repository, not direct database calls
      expect(mockTicketRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: ticketData.customer_id,
          device_brand: ticketData.device_brand,
          created_by: 'test-user-id'
        })
      )
    })
    
    it('validates customer exists before creating ticket', async () => {
      const ticketData = createTestTicketData()
      
      await service.createTicket(ticketData, 'test-user-id')
      
      // Should verify customer exists
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith(ticketData.customer_id)
    })
  })
  
  describe('Business Logic Validation', () => {
    it('creates ticket with valid data successfully', async () => {
      const ticketData = createTestTicketData()
      
      const result = await service.createTicket(ticketData, 'test-user-id')
      
      expect(result).toEqual(createExpectedTicketResponse({
        customer_id: ticketData.customer_id,
        device_brand: ticketData.device_brand,
        device_model: ticketData.device_model,
        description: ticketData.description,
        priority: ticketData.priority,
        estimated_cost: ticketData.estimated_cost,
        created_by: 'test-user-id'
      }))
    })
    
    it('validates required fields', async () => {
      const invalidData = createTestTicketData({
        customer_id: '', // Invalid
        description: ''   // Invalid
      })
      
      await expect(service.createTicket(invalidData, 'test-user-id'))
        .rejects
        .toThrow('Customer ID is required')
    })
    
    it('validates customer exists', async () => {
      const ticketData = createTestTicketData({
        customer_id: 'non-existent-customer'
      })
      
      // Mock customer not found
      mockCustomerRepo.findById.mockResolvedValueOnce(null)
      
      await expect(service.createTicket(ticketData, 'test-user-id'))
        .rejects
        .toThrow('Customer not found')
    })
    
    it('validates business rules', async () => {
      const invalidTicket = createTestTicketData({
        estimated_cost: -100, // Invalid negative cost
        priority: 'invalid'   // Invalid priority
      })
      
      await expect(service.createTicket(invalidTicket, 'test-user-id'))
        .rejects
        .toThrow('Estimated cost cannot be negative')
    })
    
    it('sets proper defaults', async () => {
      const minimalData = {
        customer_id: 'test-customer-id',
        description: 'Basic repair'
      }
      
      const result = await service.createTicket(minimalData, 'test-user-id')
      
      expect(result).toMatchObject({
        status: 'new',
        priority: 'medium', // Default priority
        created_by: 'test-user-id'
      })
    })
  })
  
  describe('Error Handling', () => {
    it('handles repository errors gracefully', async () => {
      const ticketData = createTestTicketData()
      const dbError = new Error('Database connection failed')
      
      mockTicketRepo.mockCreateFailure(dbError)
      
      await expect(service.createTicket(ticketData, 'test-user-id'))
        .rejects
        .toThrow('Failed to create repair ticket: Database connection failed')
    })
    
    it('provides user-friendly error messages', async () => {
      const ticketData = createTestTicketData({
        estimated_cost: 'invalid-number' // Type error
      })
      
      await expect(service.createTicket(ticketData, 'test-user-id'))
        .rejects
        .toThrow('Estimated cost must be a valid number')
    })
  })
  
  describe('Data Transformation', () => {
    it('transforms input data correctly', async () => {
      const inputData = createTestTicketData({
        repair_issues: ['cracked_screen', 'water_damage'],
        estimated_cost: 199.99
      })
      
      await service.createTicket(inputData, 'test-user-id')
      
      expect(mockTicketRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          repair_issues: ['cracked_screen', 'water_damage'],
          estimated_cost: 199.99,
          created_by: 'test-user-id',
          status: 'new'
        })
      )
    })
    
    it('generates proper ticket number format', async () => {
      const ticketData = createTestTicketData()
      
      const result = await service.createTicket(ticketData, 'test-user-id')
      
      expect(result.ticket_number).toMatch(/^T\d{6}$/)
    })
  })
  
  describe('Integration with Other Services', () => {
    it('triggers proper side effects', async () => {
      // Mock notification service
      const mockNotificationService = {
        notifyCustomer: jest.fn(),
        notifyTechnicians: jest.fn()
      }
      
      // Inject mock (in real implementation, use dependency injection)
      service.notificationService = mockNotificationService
      
      const ticketData = createTestTicketData({ priority: 'urgent' })
      
      await service.createTicket(ticketData, 'test-user-id')
      
      // Should trigger notification for urgent tickets
      expect(mockNotificationService.notifyTechnicians).toHaveBeenCalledWith({
        type: 'urgent_ticket_created',
        ticketId: expect.any(String)
      })
    })
  })
})
```

---

## 🏃‍♂️ Running the Test

```bash
# Run this specific test
npm test repair-ticket.service.test.ts

# Run with coverage
npm run test:coverage -- --testPathPattern="repair-ticket.service"

# Run in watch mode during development
npm test -- --watch --testPathPattern="repair-ticket.service"
```

### Expected Output

```
RepairTicketService
  Architecture Compliance
    ✓ uses repository pattern correctly
    ✓ validates customer exists before creating ticket
  Business Logic Validation  
    ✓ creates ticket with valid data successfully
    ✓ validates required fields
    ✓ validates customer exists
    ✓ validates business rules
    ✓ sets proper defaults
  Error Handling
    ✓ handles repository errors gracefully
    ✓ provides user-friendly error messages
  Data Transformation
    ✓ transforms input data correctly
    ✓ generates proper ticket number format
  Integration with Other Services
    ✓ triggers proper side effects

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        2.341s
```

---

## 🎯 What This Test Validates

### ✅ Architecture Compliance
- Service uses repository pattern (not direct DB calls)
- Proper separation of concerns
- Business logic contained in service layer

### ✅ Business Logic
- Required field validation
- Business rule enforcement  
- Default value assignment
- Data transformation accuracy

### ✅ Error Handling
- Database errors properly caught and transformed
- User-friendly error messages
- Graceful failure modes

### ✅ Integration
- Service interactions with other layers
- Side effects triggered appropriately
- Dependencies properly managed

---

## 🔄 Next Steps

After this test passes:

1. **Add Repository Tests** - Test the data layer separately
2. **Add Hook Tests** - Test React Query integration
3. **Add Integration Tests** - Test complete workflows
4. **Add Real-time Tests** - Test cache updates and real-time sync

This foundation ensures our testing validates the actual architectural principles that make our system reliable and performant.

---

**Remember**: This test demonstrates testing *behavior* and *architecture compliance*, not just code coverage. Every assertion validates something important about how our system works.