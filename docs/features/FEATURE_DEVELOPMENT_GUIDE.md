# Feature Development Guide

## 📚 Overview

This guide provides a comprehensive roadmap for developing new features in the Phone Guys CRM system. Follow these patterns and practices to ensure consistency, maintainability, and optimal performance.

## 🏗️ Architecture Foundation

Before developing new features, understand our architecture:

```
Component → Hook → API Route → Service → Repository → Database
    ↑         ↓
    └── React Query Cache ← Real-time Subscription
```

### Key Principles
- **Never use `router.refresh()`** - Let React Query handle updates
- **Never use service role keys client-side** - Always through API routes
- **Always use cache updates for real-time** - Not invalidateQueries
- **Maintain optimistic updates** - Better UX with rollback on error

## 📋 Feature Development Checklist

### Phase 1: Planning
- [ ] Define feature requirements and user stories
- [ ] Identify database schema changes needed
- [ ] Plan API endpoints required
- [ ] Design component hierarchy
- [ ] Consider real-time update needs

### Phase 2: Database
- [ ] Create migration file: `npx supabase migration new feature_name`
- [ ] Define tables, columns, and relationships
- [ ] Set up Row Level Security (RLS) policies
- [ ] Test locally: `npx supabase db reset`

### Phase 3: Backend Implementation
- [ ] Create/update repository
- [ ] Create/update service layer
- [ ] Create API routes
- [ ] Add data transformers if needed

### Phase 4: Frontend Implementation
- [ ] Create React Query hooks
- [ ] Build UI components
- [ ] Set up real-time subscriptions
- [ ] Implement optimistic updates

### Phase 5: Testing & Polish
- [ ] Test with multiple users
- [ ] Verify real-time updates
- [ ] Check error handling
- [ ] Ensure responsive design
- [ ] Update documentation

## 🔨 Step-by-Step Implementation

### Step 1: Database Migration

```sql
-- supabase/migrations/[timestamp]_add_feature_name.sql
CREATE TABLE feature_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- your columns here
);

-- Enable RLS
ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own feature_name"
  ON feature_name FOR SELECT
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_feature_name_updated_at
  BEFORE UPDATE ON feature_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

Apply migration:
```bash
npx supabase db reset  # Full reset for testing
# OR
npx supabase migration up  # Just the new migration
```

### Step 2: Create Repository

```typescript
// lib/repositories/feature.repository.ts
import { BaseRepository } from './base.repository';
import { Database } from '@/lib/types/database.types';

type Feature = Database['public']['Tables']['feature_name']['Row'];
type FeatureInsert = Database['public']['Tables']['feature_name']['Insert'];
type FeatureUpdate = Database['public']['Tables']['feature_name']['Update'];

export class FeatureRepository extends BaseRepository<Feature> {
  constructor(useServiceRole = false) {
    super('feature_name', useServiceRole);
  }

  async findWithDetails(id: string) {
    const query = this.supabase
      .from(this.table)
      .select(`
        *,
        users!feature_name_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();
    
    return this.handleResponse(query);
  }

  async findByUser(userId: string) {
    const query = this.supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return this.handleResponse(query);
  }

  // Add custom methods as needed
}
```

**Important:** Add to Repository Manager for singleton access:
```typescript
// lib/repositories/repository-manager.ts
// Add to the convenience methods:
export const getRepository = {
  // ... existing methods
  features: (useServiceRole = false) => 
    RepositoryManager.get(FeatureRepository, useServiceRole),
};
```

### Step 3: Create Service Layer

```typescript
// lib/services/feature.service.ts
import { getRepository } from '@/lib/repositories/repository-manager';
import { FeatureTransformer } from '@/lib/transformers/feature.transformer';

export interface CreateFeatureDTO {
  name: string;
  description?: string;
  // ... other fields
}

export class FeatureService {
  private featureRepo = getRepository.features(true); // service role
  
  async getFeatures(userId?: string) {
    const features = userId 
      ? await this.featureRepo.findByUser(userId)
      : await this.featureRepo.findAll();
    
    return features.map(f => FeatureTransformer.toListItem(f));
  }

  async createFeature(data: CreateFeatureDTO, userId: string) {
    // Validation
    if (!data.name?.trim()) {
      throw new Error('Name is required');
    }

    // Business logic
    const feature = await this.featureRepo.create({
      ...data,
      user_id: userId,
      status: 'active'
    });

    // Side effects (if any)
    // await this.notificationService.notify(...);

    return FeatureTransformer.toDetail(feature);
  }

  async updateFeature(id: string, data: Partial<CreateFeatureDTO>) {
    const existing = await this.featureRepo.findById(id);
    if (!existing) {
      throw new Error('Feature not found');
    }

    const updated = await this.featureRepo.update(id, data);
    return FeatureTransformer.toDetail(updated);
  }

  async deleteFeature(id: string) {
    // Check dependencies
    // ... validation logic

    return this.featureRepo.delete(id);
  }
}
```

### Step 4: Create Data Transformer

```typescript
// lib/transformers/feature.transformer.ts
export class FeatureTransformer {
  static toListItem(feature: any) {
    return {
      id: feature.id,
      name: feature.name,
      status: feature.status,
      createdAt: feature.created_at,
      userName: feature.users?.name || 'Unknown'
    };
  }

  static toDetail(feature: any) {
    return {
      ...this.toListItem(feature),
      description: feature.description,
      // ... additional detail fields
    };
  }

  static toExport(feature: any) {
    return {
      // Fields for CSV/Excel export
      Name: feature.name,
      Status: feature.status,
      'Created Date': new Date(feature.created_at).toLocaleDateString(),
      // ...
    };
  }
}
```

### Step 5: Create API Routes

```typescript
// app/api/features/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeatureService } from '@/lib/services/feature.service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new FeatureService();
    const features = await service.getFeatures(user.id);
    
    return NextResponse.json({ data: features });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const service = new FeatureService();
    const feature = await service.createFeature(data, user.id);
    
    return NextResponse.json({ data: feature });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create feature' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/features/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FeatureService } from '@/lib/services/feature.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // Implementation...
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // Implementation...
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // Implementation...
}
```

### Step 6: Create Optimized Real-time Endpoint

```typescript
// app/api/features/[id]/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { FeatureTransformer } from '@/lib/transformers/feature.transformer';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const featureRepo = getRepository.features(true);
    
    const feature = await featureRepo.findWithDetails(id);
    const transformed = FeatureTransformer.toDetail(feature);
    
    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Response-Type': 'realtime-optimized'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}
```

### Step 7: Create React Query Hook

```typescript
// lib/hooks/use-features.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from './use-realtime';
import { toast } from 'sonner';

export function useFeatures() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const response = await fetch('/api/features');
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up real-time subscription
  useRealtime({
    channel: 'features-channel',
    table: 'feature_name',
    onInsert: (payload) => {
      queryClient.setQueryData(['features'], (old: any[] = []) => 
        [payload.new, ...old]
      );
    },
    onUpdate: (payload) => {
      queryClient.setQueryData(['features'], (old: any[] = []) =>
        old.map(item => item.id === payload.new.id ? payload.new : item)
      );
    },
    onDelete: (payload) => {
      queryClient.setQueryData(['features'], (old: any[] = []) =>
        old.filter(item => item.id !== payload.old.id)
      );
    }
  });

  return query;
}

export function useFeature(id: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['features', id],
    queryFn: async () => {
      const response = await fetch(`/api/features/${id}`);
      if (!response.ok) throw new Error('Failed to fetch feature');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Real-time subscription for single feature
  useRealtime({
    channel: `feature-${id}`,
    table: 'feature_name',
    filter: `id=eq.${id}`,
    onUpdate: (payload) => {
      queryClient.setQueryData(['features', id], payload.new);
    }
  });

  return query;
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create feature');
      }
      
      return response.json();
    },
    onMutate: async (newFeature) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['features'] });
      
      // Snapshot current data
      const previousFeatures = queryClient.getQueryData(['features']);
      
      // Optimistically update
      queryClient.setQueryData(['features'], (old: any[] = []) => [
        { ...newFeature, id: 'temp-id', status: 'creating' },
        ...old
      ]);
      
      return { previousFeatures };
    },
    onError: (err, newFeature, context) => {
      // Rollback on error
      if (context?.previousFeatures) {
        queryClient.setQueryData(['features'], context.previousFeatures);
      }
      toast.error(err.message || 'Failed to create feature');
    },
    onSuccess: () => {
      toast.success('Feature created successfully');
    }
  });
}

export function useUpdateFeature(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/features/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update feature');
      return response.json();
    },
    onMutate: async (updatedData) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['features', id] });
      
      // Snapshot
      const previousFeature = queryClient.getQueryData(['features', id]);
      
      // Optimistic update
      queryClient.setQueryData(['features', id], (old: any) => ({
        ...old,
        ...updatedData
      }));
      
      return { previousFeature };
    },
    onError: (err, updatedData, context) => {
      // Rollback
      if (context?.previousFeature) {
        queryClient.setQueryData(['features', id], context.previousFeature);
      }
      toast.error('Failed to update feature');
    },
    onSuccess: () => {
      toast.success('Feature updated successfully');
    }
  });
}
```

### Step 8: Create UI Components

```typescript
// components/features/feature-list.tsx
"use client";

import { useFeatures } from '@/lib/hooks/use-features';
import { FeatureCard } from './feature-card';
import { FeatureListSkeleton } from './feature-list-skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function FeatureList() {
  const { data: features, isLoading, error } = useFeatures();
  
  if (isLoading) return <FeatureListSkeleton />;
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load features</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Features</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features?.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
      
      {features?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No features found. Create your first feature!
        </div>
      )}
    </div>
  );
}
```

```typescript
// components/features/feature-form.tsx
"use client";

import { useState } from 'react';
import { useCreateFeature } from '@/lib/hooks/use-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function FeatureForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const createMutation = useCreateFeature();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', description: '' });
        onSuccess?.();
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            name: e.target.value 
          }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            description: e.target.value 
          }))}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Feature'}
      </Button>
    </form>
  );
}
```

### Step 9: Create Page

```typescript
// app/(dashboard)/features/page.tsx
import { FeatureList } from '@/components/features/feature-list';

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-6">
      <FeatureList />
    </div>
  );
}
```

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T Do This:

```typescript
// DON'T use router.refresh()
router.refresh(); // This reloads the entire page!

// DON'T invalidate queries in real-time handlers
onUpdate: () => {
  queryClient.invalidateQueries(['features']); // Causes refetch!
}

// DON'T import repositories in client components
"use client";
import { FeatureRepository } from '@/lib/repositories/feature.repository';
// This exposes service role keys!

// DON'T forget error handling
const response = await fetch('/api/features');
const data = await response.json(); // What if response is not ok?

// DON'T skip optimistic updates
mutation.mutate(data); // No immediate feedback to user
```

### ✅ DO This Instead:

```typescript
// DO use cache updates
queryClient.setQueryData(['features'], newData);

// DO update cache directly in real-time
onUpdate: (payload) => {
  queryClient.setQueryData(['features'], old => 
    old.map(f => f.id === payload.new.id ? payload.new : f)
  );
}

// DO use API routes from client components
"use client";
const response = await fetch('/api/features');

// DO handle errors properly
const response = await fetch('/api/features');
if (!response.ok) {
  throw new Error('Failed to fetch features');
}
const data = await response.json();

// DO implement optimistic updates
onMutate: async (newData) => {
  // Show immediate feedback
  queryClient.setQueryData(['features'], optimisticData);
  return { previousData }; // For rollback
}
```

## 🧪 Testing Your Feature

### Manual Testing Checklist

1. **Single User Flow**
   - [ ] Create new item
   - [ ] View list of items
   - [ ] View single item details
   - [ ] Update item
   - [ ] Delete item

2. **Multi-User Real-time**
   - [ ] Open app in two browser windows
   - [ ] Create item in window 1, appears in window 2
   - [ ] Update item in window 1, updates in window 2
   - [ ] Delete item in window 1, disappears from window 2

3. **Error Handling**
   - [ ] Submit invalid data
   - [ ] Test network errors (disconnect internet)
   - [ ] Test with expired session
   - [ ] Verify rollback on failed mutations

4. **Performance**
   - [ ] Check no unnecessary refetches
   - [ ] Verify optimistic updates work
   - [ ] Monitor network tab for duplicate requests
   - [ ] Test with slow 3G throttling

### Automated Testing (Future)

```typescript
// __tests__/features/feature.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureList } from '@/components/features/feature-list';

describe('Feature List', () => {
  it('displays features', async () => {
    render(<FeatureList />);
    
    await waitFor(() => {
      expect(screen.getByText('Features')).toBeInTheDocument();
    });
  });
  
  // More tests...
});
```

## 📝 Documentation Template

After implementing your feature, document it:

```markdown
# Feature: [Feature Name]

## Overview
Brief description of what the feature does and why it's needed.

## Database Schema
- Table: `feature_name`
- Key columns and relationships

## API Endpoints
- `GET /api/features` - List all features
- `POST /api/features` - Create new feature
- `GET /api/features/[id]` - Get single feature
- `PATCH /api/features/[id]` - Update feature
- `DELETE /api/features/[id]` - Delete feature

## Components
- `FeatureList` - Displays list of features
- `FeatureForm` - Form for creating/editing
- `FeatureDetail` - Detailed view

## Hooks
- `useFeatures()` - Fetch all features
- `useFeature(id)` - Fetch single feature
- `useCreateFeature()` - Create mutation
- `useUpdateFeature()` - Update mutation

## Real-time Updates
- Subscribes to `feature_name` table
- Updates cache on insert/update/delete

## Security
- RLS policies implemented
- User can only see/edit own features
- Admin override available
```

## 🎯 Quick Start Template

For a quick start, copy this template structure:

```
/features/[feature-name]/
  ├── /api/
  │   └── route.ts
  ├── /components/
  │   ├── feature-list.tsx
  │   ├── feature-form.tsx
  │   └── feature-card.tsx
  ├── /hooks/
  │   └── use-features.ts
  ├── /repositories/
  │   └── feature.repository.ts
  ├── /services/
  │   └── feature.service.ts
  └── /transformers/
      └── feature.transformer.ts
```

## 💡 Pro Tips

1. **Start with the database** - Get your schema right first
2. **Build backend before frontend** - APIs should be complete before UI
3. **Test real-time early** - Catch subscription issues quickly
4. **Use TypeScript strictly** - Generate types from Supabase
5. **Follow existing patterns** - Consistency is key
6. **Document as you go** - Don't leave it for later

## 🆘 Getting Help

1. Check existing similar features for patterns
2. Review the architecture documentation
3. Look at recent commits for examples
4. Test locally before pushing
5. Use the session documents for context

## 🚀 Deployment Checklist

Before deploying your feature:

- [ ] All migrations tested locally
- [ ] API endpoints return proper status codes
- [ ] Real-time subscriptions work
- [ ] Optimistic updates and rollbacks tested
- [ ] Error messages are user-friendly
- [ ] Loading states implemented
- [ ] Mobile responsive design verified
- [ ] Documentation updated
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

---

Remember: **Consistency > Perfection**. Follow the established patterns even if you think you have a better way. Discuss architectural changes before implementing them.