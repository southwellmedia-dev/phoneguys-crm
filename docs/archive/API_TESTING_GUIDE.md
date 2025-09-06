# API Testing Guide - The Phone Guys CRM

This guide explains how to test both external (public) and internal (authenticated) API endpoints.

## API Endpoints Overview

### External APIs (No Authentication Required)
These endpoints use API key authentication for the Astro website integration:

- `GET /api/repairs?ticket_number={number}` - Check repair status
- `POST /api/repairs` - Create new repair ticket

### Internal APIs (Authentication Required)
These endpoints require Supabase authentication:

#### Orders/Tickets
- `GET /api/orders` - List repair tickets
- `POST /api/orders` - Create new ticket
- `GET /api/orders/{id}` - Get ticket details
- `PUT /api/orders/{id}` - Update ticket
- `DELETE /api/orders/{id}` - Cancel ticket
- `POST /api/orders/{id}/status` - Update status
- `POST /api/orders/{id}/timer` - Control timer
- `GET /api/orders/{id}/timer` - Get time entries

#### Customers
- `GET /api/customers` - List/search customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer
- `GET /api/customers/{id}/history` - Repair history

#### Other Endpoints
- `GET /api/users` - List users
- `GET /api/notifications` - List notifications
- `GET /api/reports/dashboard` - Dashboard metrics

## Testing External API (Astro Integration)

### Using cURL

```bash
# Check repair status
curl -X GET "http://localhost:3006/api/repairs?ticket_number=TPG0001" \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key"

# Create new repair
curl -X POST "http://localhost:3006/api/repairs" \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key" \
  -d '{
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    },
    "device": {
      "brand": "Apple",
      "model": "iPhone 15",
      "serial_number": "SN123456"
    },
    "repair_issues": ["screen_crack", "battery_issue"],
    "description": "Screen cracked and battery draining fast",
    "priority": "high"
  }'
```

## Testing Internal APIs (Authenticated)

### Step 1: Set Up Supabase Local Auth

First, ensure Supabase is running:
```bash
npx supabase start
```

### Step 2: Create Test Users

Access Supabase Studio at http://127.0.0.1:54323 and create users in the Authentication section:

1. Click on "Authentication" in the sidebar
2. Click "Add user"
3. Create users with these roles:
   - Admin: `admin@test.com` (password: `admin123`)
   - Manager: `manager@test.com` (password: `manager123`)
   - Technician: `tech@test.com` (password: `tech123`)

### Step 3: Add Users to Database

After creating auth users, add them to the `users` table:

```sql
-- Run in SQL Editor in Supabase Studio
INSERT INTO users (id, email, full_name, role) VALUES
  ('auth-user-id-here', 'admin@test.com', 'Test Admin', 'admin'),
  ('auth-user-id-here', 'manager@test.com', 'Test Manager', 'manager'),
  ('auth-user-id-here', 'tech@test.com', 'Test Tech', 'technician');
```

Replace `'auth-user-id-here'` with the actual user IDs from the Auth section.

### Step 4: Test with JavaScript

Use the provided test script:

```bash
node test-api.js
```

Or test manually with this example:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'your-anon-key-here'
);

async function testAPI() {
  // Sign in
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'admin123'
  });

  // Make authenticated request
  const response = await fetch('http://localhost:3006/api/orders', {
    headers: {
      'Cookie': `sb-access-token=${auth.session.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log(data);
}
```

### Step 5: Test with Postman/Insomnia

1. **Get Auth Token:**
   - POST to `http://127.0.0.1:54321/auth/v1/token?grant_type=password`
   - Body: `{"email":"admin@test.com","password":"admin123"}`
   - Save the `access_token` from response

2. **Use Token in Requests:**
   - Add header: `Authorization: Bearer {access_token}`
   - Or add cookie: `sb-access-token={access_token}`

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

## Authentication States

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| 200 | Success | None |
| 401 | Not authenticated | Sign in required |
| 403 | Not authorized | Insufficient permissions |
| 404 | Not found | Check resource ID |
| 400 | Bad request | Check request format |
| 500 | Server error | Check logs |

## Troubleshooting

### "Authentication required" Error
- Ensure you're signed in with Supabase Auth
- Check that the access token is being sent correctly
- Verify the user exists in the `users` table with a role

### "Insufficient permissions" Error
- Check user's role in the `users` table
- Verify the endpoint's required permissions
- Use an admin account for full access

### API Returns HTML Instead of JSON
- This is fixed in the latest version
- Ensure the middleware is updated
- API routes now return proper JSON errors

## Environment Variables

For testing, ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
EXTERNAL_API_KEY=test-api-key
```

## Permission Matrix

| Endpoint | Admin | Manager | Technician |
|----------|-------|---------|------------|
| GET /api/orders | ✅ | ✅ | ✅ (own only) |
| POST /api/orders | ✅ | ✅ | ✅ |
| DELETE /api/orders | ✅ | ✅ | ❌ |
| POST /api/orders/timer | ✅ | ✅ | ✅ |
| GET /api/customers | ✅ | ✅ | ✅ |
| DELETE /api/customers | ✅ | ✅ | ❌ |
| GET /api/users | ✅ | ✅ | ✅ |
| PUT /api/users | ✅ | ✅ | ❌ |
| GET /api/reports | ✅ | ✅ | ✅ |

## Summary

1. **External API**: Use API key in header (`x-api-key`)
2. **Internal API**: Use Supabase Auth with cookies or Authorization header
3. **Testing**: Use provided scripts or manual testing with cURL/Postman
4. **Authentication**: Middleware now properly returns JSON for API routes
5. **Permissions**: Role-based access control is enforced

The API is now fully testable with proper authentication and authorization!