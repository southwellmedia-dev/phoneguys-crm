# 🚀 Audit Logging Rollout Plan

> **Status**: Phase 1 - Admin Page Created & Infrastructure Ready  
> **Next**: Systematic rollout across all major endpoints  
> **Timeline**: Complete rollout across critical endpoints

## ✅ Phase 1: Complete (Infrastructure & Admin Interface)

### Completed Items
- ✅ **Core Infrastructure**: AuditService and middleware created
- ✅ **Admin Interface**: Audit logs page accessible at `/admin/audit-logs`
- ✅ **Sidebar Integration**: Audit Logs menu item added to admin sidebar
- ✅ **API Endpoints**: Admin audit log viewing and stats endpoints
- ✅ **Security Integration**: Combined rate limiting + audit logging (SecureAPI)
- ✅ **Documentation**: Comprehensive implementation guide

### Demo Endpoint
- ✅ **User Invite Endpoint**: `/api/admin/users/invite` - fully audited with SecureAPI.admin()

## 🎯 Phase 2: Critical Business Endpoints (Priority 1)

### Ticket/Order Management (Core Revenue)
```typescript
// Target endpoints for immediate audit implementation
[
  'app/api/orders/[id]/route.ts',           // Ticket CRUD operations
  'app/api/orders/[id]/status/route.ts',    // Status changes
  'app/api/orders/[id]/assign/route.ts',    // Ticket assignments
  'app/api/orders/[id]/timer/route.ts',     // Timer operations
  'app/api/tickets/stats/route.ts',         // Ticket statistics
]

// Implementation pattern:
export const PUT = SecureAPI.business(async (request: NextRequest) => {
  // Business logic here
  
  // Manual audit for important business events
  await auditLog.ticketStatusChanged(userId, ticketId, oldStatus, newStatus);
  
  return response;
});

// OR use automatic business audit decorators:
export const PUT = businessAudit.ticketOperation('status_change')(async (request) => {
  // Automatically logs ticket_status_change activity
  // Extracts ticket ID from URL
  // Includes operation details
});
```

### Customer Management
```typescript
// Target endpoints
[
  'app/api/customers/route.ts',                    // Customer creation
  'app/api/customers/[id]/route.ts',              // Customer updates/deletes
  'app/api/customers/[id]/devices/route.ts',      // Device management
  'app/api/customers/[id]/cascade-delete/route.ts', // Critical deletion
]

// Implementation:
export const POST = businessAudit.customerOperation('create')(handler);
export const PUT = businessAudit.customerOperation('update')(handler);
export const DELETE = businessAudit.customerOperation('delete')(handler);
```

### User Management (High Security)
```typescript
// Target endpoints
[
  'app/api/users/route.ts',              // User creation
  'app/api/users/[id]/route.ts',         // User updates
  'app/api/admin/users/[id]/route.ts',   // Admin user management
]

// Implementation:
export const POST = businessAudit.userOperation('create')(handler);
export const PUT = businessAudit.userOperation('update')(handler);
export const DELETE = businessAudit.userOperation('delete')(handler);
```

### Authentication & Security
```typescript
// Target endpoints
[
  'app/api/auth/reset-password/route.ts',    // Already done
  'app/api/auth/session/route.ts',           // Session management
  'app/api/dashboard/role/route.ts',         // Role verification
]

// Implementation:
export const POST = SecureAPI.auth(handler); // Already includes security audit
```

## 🔧 Phase 3: API & Integration Endpoints (Priority 2)

### Public API Endpoints
```typescript
// Target endpoints - high abuse potential
[
  'app/api/public/appointment/route.ts',     // Already done
  'app/api/public/services/route.ts',       // Service listings
  'app/api/public/availability/route.ts',   // Availability checks
  'app/api/public/appointments/route.ts',   // Appointment booking
]

// Implementation pattern:
export const POST = SecureAPI.public(async (request: NextRequest) => {
  // Automatically includes:
  // - Rate limiting (50 req/min)
  // - API request logging
  // - Security event detection
  // - Basic audit trails
});
```

### Admin Operations
```typescript
// Target endpoints - critical admin functions
[
  'app/api/admin/clear-timers/route.ts',          // System operations
  'app/api/admin/media/upload/route.ts',          // File uploads
  'app/api/admin/sync-devices/route.ts',          // Data synchronization
  'app/api/admin/settings/route.ts',              // System configuration
]

// Implementation:
export const POST = SecureAPI.admin(handler); // Strict rate limits + full audit
```

## 📊 Phase 4: Monitoring & Analytics Endpoints (Priority 3)

### Metrics & Reporting
```typescript
// Target endpoints
[
  'app/api/metrics/route.ts',
  'app/api/dashboard/metrics/route.ts',
  'app/api/reports/dashboard/route.ts',
  'app/api/activity/route.ts',
]

// Implementation:
export const GET = SecureAPI.general(handler); // Basic rate limiting + request logs
```

### Search & Query Endpoints
```typescript
// Target endpoints - potential performance impact
[
  'app/api/search/route.ts',
  'app/api/customers/[id]/repairs/route.ts',
  'app/api/users/[id]/activity/route.ts',
  'app/api/users/[id]/statistics/route.ts',
]

// Implementation - use search-specific rate limiting:
export const GET = withSecurityAndAudit(handler, 'search', auditConfigs.general);
```

## 🧪 Phase 5: Development & Testing Endpoints (Priority 4)

### Test Endpoints
```typescript
// Target endpoints - restrict access
[
  'app/api/test/email/route.ts',            // Already done
  'app/api/test/notification-test/route.ts',
  'app/api/test/smtp-test/route.ts',
  'app/api/test/realtime-debug/route.ts',
]

// Implementation:
export const GET = SecureAPI.test(handler); // Very strict limits, dev-only skip
```

## 🔄 Implementation Workflow

### For Each Endpoint:

1. **Identify Endpoint Type**
   ```bash
   # Authentication endpoints
   grep -r "auth" app/api/*/route.ts
   
   # Admin endpoints  
   grep -r "admin" app/api/*/route.ts
   
   # Public endpoints
   grep -r "public" app/api/*/route.ts
   
   # Business endpoints (tickets, customers, etc.)
   grep -r "tickets\|customers\|orders" app/api/*/route.ts
   ```

2. **Apply Appropriate Security Wrapper**
   ```typescript
   // Replace current export pattern:
   export async function POST(request: NextRequest) { ... }
   
   // With appropriate SecureAPI wrapper:
   export const POST = SecureAPI.admin(async (request: NextRequest) => { ... });
   ```

3. **Add Business Logic Audit Calls**
   ```typescript
   // For critical business operations, add specific audit logs:
   await auditLog.ticketCreated(userId, ticketId, details);
   await auditLog.customerUpdated(userId, customerId, changes);
   await auditLog.userDeleted(adminId, deletedUserId);
   ```

4. **Test & Verify**
   ```bash
   # Test the endpoint
   curl -X POST /api/endpoint-under-test
   
   # Check audit logs in admin panel
   # Visit: http://localhost:3000/admin/audit-logs
   
   # Verify rate limiting works
   # Make multiple rapid requests
   ```

## 📋 Implementation Checklist Template

For each endpoint update:

```markdown
### Endpoint: /api/[path]/route.ts

- [ ] **Identify endpoint type**: admin/public/business/auth/test
- [ ] **Apply SecureAPI wrapper**: Replace export function with SecureAPI.type()
- [ ] **Add business audit calls**: For create/update/delete operations
- [ ] **Test rate limiting**: Verify limits are enforced
- [ ] **Test audit logging**: Check logs appear in admin panel
- [ ] **Verify error handling**: Ensure audit failures don't break endpoint
- [ ] **Update documentation**: Add endpoint to audit coverage list

**Before:**
```typescript
export async function POST(request: NextRequest) {
  // Endpoint logic
}
```

**After:**
```typescript
export const POST = SecureAPI.admin(async (request: NextRequest) => {
  // Endpoint logic
  
  // Add specific business audit if applicable
  await auditLog.specificOperation(userId, entityId, details);
  
  return response;
});
```

**Testing:**
- [ ] Rate limiting works (returns 429 when exceeded)
- [ ] Audit logs appear in `/admin/audit-logs`
- [ ] Business operations create specific audit entries
- [ ] Security events are logged (401, 403, 429 responses)
```

## 🎯 Success Metrics

### Audit Coverage Goals
- **Week 1**: 80% of critical business endpoints (tickets, customers, users)
- **Week 2**: 90% of admin endpoints  
- **Week 3**: 95% of public API endpoints
- **Week 4**: 100% coverage across all endpoints

### Security Improvements
- **Rate Limiting**: All endpoints protected from abuse
- **Audit Trails**: Complete visibility into system activities
- **Security Monitoring**: Real-time detection of suspicious activities
- **Compliance**: Full audit trails for data access and modifications

### Monitoring & Alerting
- **Failed Login Tracking**: Monitor brute force attempts
- **Rate Limit Violations**: Detect API abuse patterns
- **Permission Denials**: Track unauthorized access attempts  
- **Critical Security Events**: Alert on high-risk activities

## 📈 Progress Tracking

### Implementation Status Dashboard
```sql
-- Query to track audit implementation progress
SELECT 
  CASE 
    WHEN endpoint LIKE '%/admin/%' THEN 'Admin'
    WHEN endpoint LIKE '%/public/%' THEN 'Public'  
    WHEN endpoint LIKE '%/auth/%' THEN 'Auth'
    WHEN endpoint LIKE '%/test/%' THEN 'Test'
    ELSE 'Business'
  END as endpoint_type,
  COUNT(DISTINCT endpoint) as total_endpoints,
  COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN endpoint END) as active_endpoints
FROM api_request_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY endpoint_type
ORDER BY total_endpoints DESC;
```

This systematic rollout ensures comprehensive audit coverage while maintaining system performance and security.