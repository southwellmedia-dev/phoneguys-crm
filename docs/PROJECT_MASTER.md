# 📱 The Phone Guys CRM - Master Project Documentation

> **This is the master reference document for The Phone Guys CRM project. All team members and AI agents should read this document first to understand the project context, architecture, and current status.**

---

## 🎯 Project Mission Statement
Build a robust, scalable, and user-friendly CRM/Booking platform for The Phone Guys mobile device repair service that streamlines repair management, enhances customer communication, and improves operational efficiency.

## 📋 Quick Links & Resources
- **[Project Checklist](./project-checklist.md)** - Detailed implementation phases and progress tracking
- **[Development Guidelines](./DEVELOPMENT_GUIDELINES.md)** - Coding standards and patterns
- **[Design System](./design-ui/DESIGN_SYSTEM_OVERVIEW.md)** - Complete design system documentation
- **[Initial Requirements](./initial-plan.md)** - Original project brief and scope
- **[CLAUDE.md](../CLAUDE.md)** - Technical guidance for Claude Code AI
- **[Signed Agreement](./AKH%20Digital%20Website%20Agreement-Signed(06-11-24).pdf)** - Contract documentation
- **Supabase Studio (Local)**: http://127.0.0.1:54323
- **Local API**: http://127.0.0.1:54321
- **Production Project**: https://supabase.com/dashboard/project/egotypldqzdzjclikmeg

## 🏗️ Project Architecture Overview

### Technology Stack
- **Frontend Framework**: Next.js 15 (App Router) with TypeScript
- **UI Components**: Tailwind CSS + shadcn/ui (New York style)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **External Integration**: REST API for Astro website form submissions
- **Development Tools**: Turbopack, ESLint, Supabase CLI

### Architectural Patterns
1. **Repository Pattern**: Abstracting database operations
2. **Service Layer**: Business logic encapsulation
3. **API Routes**: RESTful endpoints for external integration
4. **Component-Based UI**: Reusable React components with design system
5. **RLS (Row Level Security)**: Database-level security policies

## 💾 Database Schema Summary
The database is already set up with the following core tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `customers` | Customer information | name, email, phone |
| `repair_tickets` | Main repair tracking | ticket_number (TPG0001), status, device info, timer data |
| `ticket_notes` | Internal/customer notes | note_type, content, is_important |
| `time_entries` | Billing time tracking | start_time, end_time, duration_minutes |
| `notifications` | Email queue system | notification_type, status, sent_at |
| `users` | Staff accounts | email, role (admin/technician/manager) |

**Important**: Ticket numbers auto-generate as TPG0001, TPG0002, etc. via PostgreSQL trigger.

## 🚀 Current Project Status

### ✅ Completed
- Project initialization with Next.js 15 and TypeScript
- Supabase integration and local development setup
- Complete backend implementation (APIs, repositories, services)
- Full authentication system with protected routes
- **Frontend CRM UI with dashboard, orders management, and navigation**
- **Brand identity implementation with correct colors (#0094CA, #fb2c36)**
- **Professional login page and authentication flow**
- Database schema with seed data and test users
- **Global timer system with persistence and cross-tab sync**
- **Status management with validation and workflows**
- **Time tracking with required work notes**
- **Optimized data fetching (eliminated N+1 queries)**

### 🚧 In Progress
- Customer management pages
- Order creation and editing forms
- Email notification templates
- Reports and analytics dashboard
- Settings and user management pages

### 📅 Upcoming Next Steps
1. Complete customer management interface
2. Build order creation/editing workflow
3. Implement email notification system
4. Create reporting dashboard with charts
5. Add settings pages for system configuration

## 🔐 Security & Authentication

### Authentication Flow
- Staff login via Supabase Auth (email/password)
- Cookie-based session management
- Protected routes redirect to `/auth/login` if unauthorized
- Role-based permissions (Admin, Technician, Manager)

### API Security
- External API endpoints for Astro website will use API keys
- All database operations use Row Level Security
- Input validation and sanitization on all endpoints

## 🔄 Integration Points

### Astro Website Integration
The existing customer-facing website (built with Astro) will submit repair requests to our CRM via REST API:

```
POST /api/repairs
{
  "customer": { name, email, phone },
  "device": { brand, model, serial_number, imei },
  "issues": ["screen_crack", "battery_issue"],
  "description": "Detailed problem description"
}
```

The CRM will:
1. Validate the submission
2. Create a new repair ticket
3. Send confirmation email to customer
4. Notify staff of new repair request

## 📝 Development Workflow

### Local Development Setup
```bash
# Start Supabase local services
npx supabase start

# Run development server
npm run dev

# Access points:
# - App: http://localhost:3000
# - Supabase Studio: http://127.0.0.1:54323
# - API: http://127.0.0.1:54321
```

### Database Management
```bash
# Pull latest schema from production
npx supabase db pull --password "iZPi-8JYjn?0KtvY"

# Reset and seed local database
npx supabase db reset

# Push changes to production (use with caution!)
npx supabase db push --password "iZPi-8JYjn?0KtvY"
```

### Environment Variables
- **Local Development**: Use `.env.local.development`
- **Production**: Use `.env.local`
- **Required vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎨 UI/UX Design Principles

### Design System
- **Primary Colors**: Cyan (#0094CA) and Red (#fb2c36) - corrected brand colors
- **Typography**: Geist font family with defined scale system
- **Components**: Based on shadcn/ui New York style with brand customization
- **Dark Mode**: Navy-based dark theme with full support
- **Responsive**: Mobile-first approach with 5 breakpoints
- **Full Documentation**: See [Design System Overview](./design-ui/DESIGN_SYSTEM_OVERVIEW.md)

### Key User Interfaces
1. **Dashboard**: Overview metrics, recent tickets, quick actions
2. **Orders Grid**: Filterable, sortable repair ticket management
3. **Timer Interface**: Start/stop billing timer with visual feedback
4. **Customer View**: Contact info, repair history, notes
5. **Settings**: User management, email templates, system config

## 📊 Business Logic & Features

### Repair Workflow States
```
NEW → IN_PROGRESS → ON_HOLD → COMPLETED
         ↓              ↓          ↓
    (timer runs)   (waiting)   (notify)
```

### Timer & Billing System
- Technicians can start/stop timers on repairs
- Time automatically tracked in `time_entries` table
- Total time calculated for billing purposes
- Multiple timer sessions per repair supported

### Notification System
- **New Ticket**: Staff notified when repair submitted
- **Status Changes**: Customer notified on updates
- **Completion**: Auto-email when repair ready
- **On Hold**: Notify customer of delays

## 🐛 Known Issues & Considerations

1. **Docker Networking**: Port conflicts may occur on Windows. Use `npx supabase stop` before starting.
2. **Auth Users**: Seed data includes user records but actual Supabase Auth users need manual creation in Studio.
3. **Production Password**: Database password is `iZPi-8JYjn?0KtvY` (handle with care)
4. **Migration History**: Some migrations marked as reverted during initial setup (normal behavior)

## 📚 Additional Documentation

### For Developers
- Review [CLAUDE.md](../CLAUDE.md) for AI-assisted development guidance
- Check [project-checklist.md](./project-checklist.md) for detailed task breakdowns
- Follow [Design System](./design-ui/DESIGN_SYSTEM_OVERVIEW.md) for UI consistency
- Refer to seed.sql for data structure examples

### For Project Managers
- Track progress in [project-checklist.md](./project-checklist.md)
- Current phase: **Phase 2 - Database & Data Layer**
- Estimated completion: ~15% (as of January 3, 2025)

### For Testing
- Use seed data for testing various scenarios
- Test accounts available in local Supabase Studio
- Sample repair tickets in various states included

## 🤝 Communication & Support

### Project Team
- **Client**: The Phone Guys
- **Development**: AKH Digital
- **Project Type**: Custom CRM/Booking Platform

### Important Notes for Future Agents
1. **Always check this document first** for project context
2. **Follow [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)** for code standards
3. **Refer to checklist** for current tasks and priorities
4. **Use existing patterns** - repository pattern, service layer
5. **Test with seed data** before implementing new features
6. **Maintain documentation** - update this file with major changes
7. **Follow security best practices** - especially with customer data
8. **Coordinate database changes** - migrations affect production

## 🚦 Quick Start for New Developers/Agents

1. **Read this document completely**
2. **Review [project-checklist.md](./project-checklist.md)** for current status
3. **Set up local environment**:
   ```bash
   npm install
   npx supabase start
   npm run dev
   ```
4. **Explore the database** at http://127.0.0.1:54323
5. **Check current phase** in checklist and pick up tasks
6. **Test your changes** with existing seed data
7. **Update documentation** as you progress

---

**Last Updated**: January 10, 2025 (Session 7)  
**Project Phase**: Core Features Development (Phase 5)  
**Next Milestone**: Customer Management & Forms Implementation  
**Overall Progress**: ~90%

---

*This document should be updated regularly as the project evolves. All major architectural decisions, schema changes, and milestone completions should be reflected here.*