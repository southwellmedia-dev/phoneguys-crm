# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Essential Documentation
Before starting work, review these critical documents:
- **[PROJECT_MASTER.md](./docs/PROJECT_MASTER.md)** - Complete project context and overview
- **[DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md)** - Coding standards, patterns, and folder structure
- **[project-checklist.md](./docs/project-checklist.md)** - Implementation phases and current progress

## Project Overview
This is a Next.js 15 application with Supabase authentication, using TypeScript, Tailwind CSS, and shadcn/ui components.
This project aims to develop a custom CRM/Booking platform for "The Phone Guys," a mobile device repair service. It will integrate with their existing Astro-based customer-facing website, providing a robust backend for managing repair requests, orders, customer data, and internal operations.

Key features include:
- **Online Repair Management**: Capturing multi-step repair form data from the Astro website and auto-creating tickets
- **Order Management**: Tracking repair status, time, customer notes, and automated notifications
- **Customer Relationship Management**: Managing customer data, submissions, user roles, and search functionality

Our Supabase instance is already set up with existing schema and seed data.

## Commands

### Development
```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build production application
npm start          # Start production server
npm run lint       # Run ESLint
```

### TypeScript Check
```bash
npx tsc --noEmit   # Type-check without emitting files
```

### Supabase Local Development
```bash
npx supabase start  # Start local Supabase services
npx supabase stop   # Stop local Supabase services
npx supabase status # Check status of local services
npx supabase db push --password "iZPi-8JYjn?0KtvY"  # Push local changes to remote
npx supabase db pull --password "iZPi-8JYjn?0KtvY"  # Pull remote schema

# Local URLs
# Studio: http://127.0.0.1:54323
# API: http://127.0.0.1:54321
# DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Architecture & Development Patterns

### 📁 Project Structure
Follow the structure defined in [DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md):
- `/app` - Next.js App Router pages and API routes
- `/lib/repositories` - Data access layer (Repository pattern)
- `/lib/services` - Business logic layer (Service pattern)
- `/lib/types` - TypeScript type definitions
- `/components` - React components (organized by feature)

### 🏗️ Key Patterns to Follow
1. **Repository Pattern**: All database access through repository classes
2. **Service Layer**: Business logic separated from controllers
3. **DTO Pattern**: Use Data Transfer Objects for API communication
4. **Validation**: Zod schemas for all input validation
5. **Error Handling**: Custom error classes with proper status codes

### 🎯 Development Workflow

### Authentication Flow
- Uses Supabase Auth with cookie-based sessions via `@supabase/ssr`
- Middleware (`middleware.ts`) refreshes sessions on every request
- Protected routes check authentication using `supabase.auth.getClaims()` and redirect to `/auth/login` if unauthorized
- Auth routes: `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`

### Supabase Client Creation Pattern
- **Server Components**: Use `createClient()` from `lib/supabase/server.ts`
- **Client Components**: Use `createClient()` from `lib/supabase/client.ts`
- **Middleware**: Uses `updateSession()` from `lib/supabase/middleware.ts`
- Always create new client instances within functions, never store in global variables

### UI Components
- Uses shadcn/ui components (New York style, CSS variables)
- Component configuration in `components.json`
- Custom components in `components/` directory
- UI primitives in `components/ui/`
- Theme switching via `next-themes` provider

### REST API for External Integration
- The CRM needs to expose a REST API endpoint(s) for the Astro website to submit repair requests. This API should be designed to receive the multi-step form data.
- This API should handle data validation and securely store the repair request in the Supabase database, creating a new "job ticket."
- Consider using Next.js Route Handlers (app/api/...) for these API endpoints.
- Secure API endpoints as necessary, potentially with API keys or other authentication methods if the Astro site requires it (discuss with client if needed).

### Environment Variables
Required for Supabase connection:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

For local development, use `.env.local.development` with local Supabase URLs.
For production, use `.env.local` with production Supabase URLs.

### Database Schema
Existing tables in the database:
- `customers` - Customer information
- `repair_tickets` - Main repair ticket management
- `ticket_notes` - Notes on repair tickets  
- `time_entries` - Time tracking for billing
- `notifications` - Email notification queue
- `users` - Staff users management

### Path Aliases
- `@/*` maps to root directory (configured in tsconfig.json)

## Key Patterns

### Protected Routes
Protected pages should check authentication and redirect:
```typescript
const supabase = await createClient();
const { data, error } = await supabase.auth.getClaims();
if (error || !data?.claims) {
  redirect("/auth/login");
}
```

### Form Components
Auth forms (login, sign-up, etc.) use Server Actions for form submission and handle errors/success states inline.

## 🎯 Implementation Priorities

When implementing features, follow this priority order:
1. **Data Layer First**: Create repositories for database access
2. **Business Logic**: Implement services with business rules
3. **API Routes**: Build REST endpoints with proper validation
4. **UI Components**: Create reusable components following design system
5. **Integration**: Connect components to API and test end-to-end

## 📝 Important Notes for Development

1. **Always follow the patterns** in [DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md)
2. **Check current progress** in [project-checklist.md](./docs/project-checklist.md)
3. **Use existing seed data** for testing (see `supabase/seed.sql`)
4. **Maintain type safety** - no `any` types unless absolutely necessary
5. **Write clean, self-documenting code** - minimize comments, maximize clarity
6. **Test locally first** before pushing any database changes
7. **Use the existing database schema** - tables are already created

## 🔍 Where to Find Things

- **Database Schema**: `supabase/migrations/20250903141058_remote_schema.sql`
- **Seed Data**: `supabase/seed.sql`
- **Environment Variables**: `.env.local` (production) and `.env.local.development` (local)
- **Project Documentation**: `docs/` folder
- **Current Implementation Status**: ~15% complete (Phase 2: Database & Data Layer)