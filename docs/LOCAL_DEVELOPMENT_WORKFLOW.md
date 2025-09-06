# Local Development Workflow

## Current Setup
- Local Supabase is running with production schema and data
- Auth users are synced from production
- Environment is configured via `.env.local` (pointing to local Supabase)

## Switching Between Local and Production

### Use Local Development
```bash
cp .env.local.development .env.local
npm run dev
```

### Use Production (for testing)
```bash
cp .env.local.production .env.local
npm run dev
```

## Database Development Workflow

### 1. Creating New Features with Database Changes

```bash
# Create a new migration
npx supabase migration new your_feature_name

# Edit the migration file in supabase/migrations/
# Add your SQL changes (CREATE TABLE, ALTER TABLE, etc.)

# Test locally
npx supabase db reset  # This rebuilds everything from scratch

# Or apply just your migration
npx supabase migration up
```

### 2. Testing Your Changes

1. Make database changes via migration files
2. Test locally with `npx supabase db reset`
3. Develop and test your application code
4. Commit both migration and code changes together

### 3. Deploying to Production

```bash
# Make sure you're linked to production
npx supabase link --project-ref egotypldqzdzjclikmeg

# Push your migrations to production
npx supabase db push --password "iZPi-8JYjn?0KtvY"

# Deploy your code via git
git push origin main
```

## Important Notes

### DO NOT:
- Modify existing migration files (20250906132220_remote_schema.sql, 20250906132236_remote_schema.sql)
- Make direct database changes in production via Studio
- Use `supabase db pull` after creating local migrations (it will conflict)

### DO:
- Always create new migration files for new features
- Test migrations locally first with `npx supabase db reset`
- Keep migrations small and focused
- Name migrations descriptively (e.g., `add_user_preferences_table`)
- Commit migrations with related code changes

## Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Examples:
- `20250906143000_add_invoice_system.sql`
- `20250906144500_add_user_preferences.sql`
- `20250906150000_update_appointment_notifications.sql`

## Handling Migration Conflicts

If you get migration history conflicts:

1. **For local development**: Just reset
   ```bash
   npx supabase db reset
   ```

2. **For production deployment**: 
   ```bash
   # Check what migrations are in production
   npx supabase migration list --password "iZPi-8JYjn?0KtvY"
   
   # Only push if your new migration isn't there
   npx supabase db push --password "iZPi-8JYjn?0KtvY"
   ```

## Rollback Strategy

If a migration fails in production:

1. Create a new migration that reverses the changes
2. Never delete or modify existing migrations
3. Always move forward with new migrations

## Example: Adding a New Feature

Let's say you want to add an invoicing system:

```bash
# 1. Create migration
npx supabase migration new add_invoice_system

# 2. Edit the migration file
# supabase/migrations/[timestamp]_add_invoice_system.sql

# 3. Add your SQL
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

# 4. Test locally
npx supabase db reset

# 5. Develop your feature
# Create API routes, components, etc.

# 6. Commit everything
git add .
git commit -m "feat: add invoice system"

# 7. Deploy to production
npx supabase db push --password "iZPi-8JYjn?0KtvY"
git push origin main
```

## Current Migration Status

As of 2025-09-06:
- `20250906132220_remote_schema.sql` - Initial production schema
- `20250906132236_remote_schema.sql` - Auth schema
- All previous migrations have been consolidated into these two files
- New features should create new migration files

## Troubleshooting

### "Migration history doesn't match"
- This is expected if you've been developing locally
- Use `npx supabase db reset` for local development
- Only push NEW migrations to production

### "Cannot modify auth schema"
- Auth schema is managed by Supabase
- Use triggers or public schema tables for auth-related features
- Never directly modify auth.users in migrations

### "Local data is out of sync"
- Re-dump production data: `npx supabase db dump --data-only`
- Update seed.sql
- Run `npx supabase db reset`