# 🔍 Comprehensive Audit Logging System

> **Status**: ✅ IMPLEMENTED  
> **Coverage**: All API endpoints can be audited  
> **Priority**: HIGH (Compliance & Security Monitoring)

## 📊 Implementation Overview

Our audit logging system leverages existing database infrastructure and provides comprehensive tracking of:

- **User Activities** - Business operations and data changes
- **API Requests** - Request/response logging with full context
- **Security Events** - Authentication, authorization, and suspicious activity
- **System Events** - Errors, performance issues, and system changes

## 🏗️ Architecture

### Existing Database Infrastructure

The system utilizes three existing audit tables:

#### 1. `user_activity_logs`
```sql
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `api_request_logs`  
```sql
CREATE TABLE api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    origin VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `email_log`
```sql  
CREATE TABLE email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES email_queue(id),
    to_addresses TEXT[],
    subject TEXT,
    template_used TEXT,
    status TEXT NOT NULL,
    message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Layer

**Core Service**: `lib/services/audit.service.ts`
- Singleton service for unified audit logging
- Leverages existing database tables
- Provides type-safe audit operations
- Includes convenience functions for common scenarios

**Middleware**: `lib/utils/audit-middleware.ts`  
- Automatic API request/response logging
- User activity tracking for business operations
- Security event detection and logging
- Configurable audit policies per endpoint type

## 🚀 Usage Examples

### Basic User Activity Logging

```typescript
import { auditLog } from '@/lib/services/audit.service';

// User management
await auditLog.userCreated(adminId, newUserId, {
  email: 'user@example.com',
  role: 'technician',
  invited_by: 'Admin User'
});

await auditLog.userUpdated(adminId, userId, {
  changes: { role: 'manager' },
  previous_role: 'technician'
});

// Business operations
await auditLog.ticketCreated(userId, ticketId, {
  customer_id: customerId,
  device: 'iPhone 15 Pro',
  priority: 'high'
});

await auditLog.ticketStatusChanged(userId, ticketId, 'new', 'in_progress');

// Security events
await auditLog.loginSuccess(userId, ipAddress);
await auditLog.permissionDenied(userId, 'admin_panel', 'access', ipAddress);
await auditLog.rateLimitExceeded(ipAddress, '/api/public/appointment', 50);
```

### Automatic Endpoint Auditing

```typescript
import { SecureAPI } from '@/lib/utils/api-helpers';

// Combines rate limiting + audit logging
export const POST = SecureAPI.admin(async (request: NextRequest) => {
  // Your endpoint logic here
  // Automatic logging of:
  // - API request/response
  // - User activity (if configured)
  // - Security events (auth failures, rate limits, etc.)
});

// Available decorators:
SecureAPI.auth(handler)     // Auth endpoints - strict limits + full audit
SecureAPI.admin(handler)    // Admin endpoints - strict limits + full audit  
SecureAPI.public(handler)   // Public endpoints - moderate limits + request audit
SecureAPI.test(handler)     // Test endpoints - very strict + minimal audit
SecureAPI.general(handler)  // General endpoints - moderate limits + basic audit
```

### Business Operation Auditing

```typescript
import { businessAudit } from '@/lib/utils/audit-middleware';

// Ticket operations
export const PUT = businessAudit.ticketOperation('update')(async (request) => {
  // Automatically logs:
  // - ticket_update activity
  // - Extracts ticket ID from URL
  // - Includes operation details
});

// Customer operations  
export const POST = businessAudit.customerOperation('create')(async (request) => {
  // Logs customer_create with extracted customer ID
});

// User management
export const DELETE = businessAudit.userOperation('delete')(async (request) => {
  // Logs user_delete with full audit trail
});
```

### Manual Audit Logging

```typescript
import { AuditService } from '@/lib/services/audit.service';

const auditService = AuditService.getInstance();

// User activity
await auditService.logUserActivity({
  userId: 'user-123',
  activityType: 'custom_operation',
  entityType: 'custom_entity',
  entityId: 'entity-456',
  details: {
    operation: 'bulk_update',
    affected_records: 25,
    duration: '2.3s'
  }
});

// Security event
await auditService.logSecurityEvent({
  eventType: 'suspicious_activity',
  userId: 'user-123',
  ipAddress: '192.168.1.100',
  details: {
    activity: 'multiple_failed_permissions',
    attempts: 5,
    resources: ['admin_panel', 'user_management']
  },
  riskLevel: 'high'
});

// System event
await auditService.logSystemEvent({
  eventType: 'database_maintenance',
  entityType: 'system',
  details: {
    operation: 'index_rebuild',
    tables: ['user_activity_logs', 'api_request_logs'],
    duration: '15 minutes'
  }
});
```

## 📋 Audit Event Types

### User Activities
- `user_created` - New user invited/created
- `user_updated` - User profile/settings changed  
- `user_deleted` - User account removed
- `ticket_created` - New repair ticket created
- `ticket_updated` - Ticket information modified
- `ticket_status_changed` - Ticket status transition
- `ticket_assigned` - Ticket assigned to technician
- `customer_created` - New customer added
- `customer_updated` - Customer information modified
- `appointment_created` - New appointment scheduled
- `appointment_converted` - Appointment converted to ticket

### Security Events  
- `security_login_attempt` - Login attempt (before validation)
- `security_login_success` - Successful authentication
- `security_login_failure` - Failed authentication
- `security_permission_denied` - Unauthorized access attempt
- `security_rate_limit_exceeded` - Rate limit violation
- `security_suspicious_activity` - Detected suspicious behavior

### System Events
- `endpoint_error` - API endpoint error
- `server_error` - Server-side error (5xx responses)  
- `database_maintenance` - Database operations
- `system_configuration_change` - System settings modified

## 🔍 Querying Audit Logs

### Service Method
```typescript
const auditService = AuditService.getInstance();

// Get user's activity history
const userActivities = await auditService.getAuditLogs({
  userId: 'user-123',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  limit: 50
});

// Get all ticket operations
const ticketLogs = await auditService.getAuditLogs({
  entityType: 'ticket',
  activityType: 'ticket_status_changed',
  limit: 100
});

// Get security events
const securityLogs = await auditService.getAuditLogs({
  activityType: 'security_login_failure',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  limit: 25
});
```

### Direct Database Queries
```sql
-- Recent user activities
SELECT 
  ual.activity_type,
  ual.entity_type,
  ual.details,
  ual.created_at,
  u.name as user_name
FROM user_activity_logs ual
JOIN users u ON ual.user_id = u.id
WHERE ual.created_at > NOW() - INTERVAL '7 days'
ORDER BY ual.created_at DESC;

-- API request patterns
SELECT 
  endpoint,
  method,
  COUNT(*) as request_count,
  AVG(response_status) as avg_status,
  COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count
FROM api_request_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY endpoint, method
ORDER BY request_count DESC;

-- Security events by risk level
SELECT 
  details->>'risk_level' as risk_level,
  activity_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_activity_logs
WHERE activity_type LIKE 'security_%'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY details->>'risk_level', activity_type
ORDER BY event_count DESC;
```

## 📊 Audit Reports

### Security Dashboard Queries

#### Failed Login Attempts (Last 24 Hours)
```sql
SELECT 
  details->>'email' as email,
  details->>'ip_address' as ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM user_activity_logs
WHERE activity_type = 'security_login_failure'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY details->>'email', details->>'ip_address'
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;
```

#### Rate Limit Violations
```sql
SELECT 
  details->>'ip_address' as ip_address,
  details->>'endpoint' as endpoint,
  COUNT(*) as violations,
  MIN(created_at) as first_violation,
  MAX(created_at) as last_violation
FROM user_activity_logs
WHERE activity_type = 'security_rate_limit_exceeded'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY details->>'ip_address', details->>'endpoint'
ORDER BY violations DESC;
```

#### User Activity Summary
```sql
SELECT 
  u.name,
  u.email,
  u.role,
  COUNT(ual.id) as total_activities,
  COUNT(CASE WHEN ual.activity_type LIKE 'ticket_%' THEN 1 END) as ticket_activities,
  COUNT(CASE WHEN ual.activity_type LIKE 'customer_%' THEN 1 END) as customer_activities,
  MAX(ual.created_at) as last_activity
FROM users u
LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
WHERE ual.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email, u.role
ORDER BY total_activities DESC;
```

## 🛡️ Security & Compliance Benefits

### Immediate Security Improvements
- ✅ **Intrusion Detection**: Failed login tracking and suspicious activity monitoring
- ✅ **Access Control Audit**: Permission denied events for compliance
- ✅ **Rate Limit Monitoring**: API abuse detection and prevention
- ✅ **User Behavior Tracking**: Unusual activity pattern detection

### Compliance & Governance
- ✅ **Data Access Trail**: Who accessed what data when
- ✅ **Change Management**: Complete audit trail of data modifications
- ✅ **Administrative Actions**: Full logging of admin operations
- ✅ **Incident Response**: Comprehensive logs for security investigations

### Operational Benefits
- ✅ **Performance Monitoring**: API response times and error rates
- ✅ **Usage Analytics**: Endpoint usage patterns and user behavior
- ✅ **Error Tracking**: System errors and failure patterns
- ✅ **Capacity Planning**: Load patterns and resource utilization

## 🚨 Monitoring & Alerting

### Critical Security Events
Set up alerts for:
- Multiple failed login attempts from same IP
- Rate limit violations exceeding threshold
- Permission denied events for admin endpoints
- Suspicious activity patterns (e.g., rapid API calls)

### Example Alert Queries
```sql
-- Potential brute force attack
SELECT COUNT(*) as failed_attempts
FROM user_activity_logs
WHERE activity_type = 'security_login_failure'
  AND details->>'ip_address' = $1
  AND created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) > 10;

-- Unusual admin activity
SELECT COUNT(*) as admin_actions
FROM user_activity_logs ual
JOIN users u ON ual.user_id = u.id
WHERE u.role = 'admin'
  AND ual.created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) > 50;

-- High error rate
SELECT 
  COUNT(CASE WHEN response_status >= 500 THEN 1 END) * 100.0 / COUNT(*) as error_rate
FROM api_request_logs
WHERE created_at > NOW() - INTERVAL '15 minutes'
HAVING COUNT(CASE WHEN response_status >= 500 THEN 1 END) * 100.0 / COUNT(*) > 5.0;
```

## 📈 Performance Considerations

### Database Impact
- **Indexes**: Proper indexing on frequently queried columns
- **Partitioning**: Consider partitioning audit tables by date for large volumes
- **Retention**: Implement data retention policies for old audit logs

### Application Impact
- **Async Logging**: Audit logging designed to not block main application flow
- **Error Isolation**: Audit failures don't affect business operations
- **Batching**: Bulk audit operations for performance

### Scaling Strategies
- **Database Optimization**: Regular maintenance and query optimization
- **Archive Strategy**: Move old logs to cold storage
- **Monitoring**: Track audit system performance and storage usage

## 🔧 Maintenance

### Regular Tasks
- **Log Rotation**: Archive old audit logs based on retention policy
- **Index Maintenance**: Rebuild indexes on high-volume audit tables
- **Storage Monitoring**: Monitor audit table sizes and growth patterns
- **Performance Review**: Analyze slow audit queries and optimize

### Troubleshooting
- **Missing Logs**: Check audit middleware configuration and error logs
- **Performance Issues**: Review database query performance and indexing
- **Storage Issues**: Implement log rotation and archival procedures

---

## 📚 Implementation Files

- **Core Service**: `lib/services/audit.service.ts` - Main audit service with all logging capabilities
- **Middleware**: `lib/utils/audit-middleware.ts` - Automatic endpoint auditing
- **API Helpers**: `lib/utils/api-helpers.ts` - SecureAPI decorators combining rate limiting + audit
- **Database Schema**: 
  - `supabase/migrations/*user_activity*` - User activity logs table
  - `supabase/migrations/*api_request_logs*` - API request logs table  
  - `supabase/migrations/*email_queue*` - Email audit logs table

- **Protected Endpoint Example**: `app/api/admin/users/invite/route.ts` - Demonstrates SecureAPI usage

This audit logging system provides comprehensive security monitoring, compliance tracking, and operational visibility while leveraging existing database infrastructure for maximum efficiency.