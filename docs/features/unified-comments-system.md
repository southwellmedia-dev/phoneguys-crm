# Unified Comments System - Implementation Plan

## Overview
Transform the fragmented notes system into a unified, real-time commenting system that works across both appointments and tickets, providing a modern collaboration experience similar to GitHub or Slack.

## Current State Analysis

### Problems with Existing System
1. **Fragmented Storage**
   - Tickets use `ticket_notes` table with proper structure
   - Appointments use JSON text fields with no history
   
2. **Poor User Experience**
   - No conversation threading
   - No real-time updates
   - Inconsistent UI components
   - No user tracking in appointments
   
3. **Limited Features**
   - No mentions or notifications
   - No file attachments
   - No edit history
   - No reactions or quick responses

## Proposed Solution

### Core Architecture

#### 1. Database Schema

```sql
-- Main comments table (polymorphic design)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic association
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ticket', 'appointment')),
  entity_id UUID NOT NULL,
  
  -- Comment data
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML for performance
  visibility TEXT NOT NULL DEFAULT 'internal' 
    CHECK (visibility IN ('internal', 'customer', 'system')),
  
  -- Metadata
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES users(id),
  
  -- Threading
  parent_comment_id UUID REFERENCES comments(id),
  thread_id UUID, -- Root comment ID for efficient queries
  
  -- Rich features
  mentions UUID[], -- Array of mentioned user IDs
  attachments JSONB, -- File attachments metadata
  is_pinned BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_thread ON comments(thread_id, created_at) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions) 
  WHERE deleted_at IS NULL;

-- Reactions table
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  reaction TEXT NOT NULL, -- emoji or predefined reaction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction)
);

-- Edit history table
CREATE TABLE comment_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_by UUID REFERENCES users(id),
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Read receipts for tracking
CREATE TABLE comment_reads (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);
```

#### 2. RLS Policies

```sql
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reads ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Users can view comments on their accessible entities" ON comments
  FOR SELECT USING (
    -- Check entity access based on entity_type
    CASE 
      WHEN entity_type = 'ticket' THEN 
        EXISTS (
          SELECT 1 FROM repair_tickets t 
          WHERE t.id = entity_id 
          AND (auth.uid() = t.assigned_to OR auth.uid() = t.created_by)
        )
      WHEN entity_type = 'appointment' THEN
        EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.id = entity_id 
          AND (auth.uid() = a.assigned_to OR auth.uid() = a.created_by)
        )
    END
  );

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (deleted_at IS NOT NULL);
```

### Implementation Plan

## Phase 1: Database & Backend (Day 1)

### Tasks:
1. **Create Migration**
   - New tables (comments, reactions, edits, reads)
   - Indexes for performance
   - RLS policies

2. **Build Repository Layer**
   ```typescript
   class CommentRepository extends BaseRepository {
     // Core CRUD
     async getComments(entityType: string, entityId: string, options?: CommentQueryOptions)
     async getThread(threadId: string)
     async createComment(data: CreateCommentDto)
     async updateComment(id: string, content: string, userId: string)
     async deleteComment(id: string, userId: string) // Soft delete
     
     // Features
     async pinComment(id: string)
     async resolveComment(id: string)
     async addReaction(commentId: string, userId: string, reaction: string)
     async removeReaction(commentId: string, userId: string, reaction: string)
     async markAsRead(commentId: string, userId: string)
     
     // Queries
     async searchComments(query: string, filters: CommentFilters)
     async getUserMentions(userId: string)
     async getUnreadCount(entityType: string, entityId: string, userId: string)
   }
   ```

3. **Build Service Layer**
   ```typescript
   class CommentService {
     // Core operations
     async postComment(entity: CommentEntity, content: string, options: CommentOptions)
     async editComment(commentId: string, newContent: string, userId: string)
     async deleteComment(commentId: string, userId: string)
     
     // Notifications
     async notifyMentions(commentId: string, mentions: string[])
     async notifyReply(parentCommentId: string, replyId: string)
     
     // Processing
     async processContent(content: string): ProcessedContent // Parse mentions, links
     async renderMarkdown(content: string): string // Convert to HTML
     
     // File handling
     async attachFile(commentId: string, file: File)
     async removeAttachment(commentId: string, attachmentId: string)
   }
   ```

## Phase 2: Core UI Components (Day 2)

### Components to Build:

1. **CommentThread.tsx**
   ```typescript
   interface CommentThreadProps {
     entityType: 'ticket' | 'appointment'
     entityId: string
     currentUserId: string
     allowCustomerComments?: boolean
     className?: string
   }
   ```

2. **CommentItem.tsx**
   ```typescript
   interface CommentItemProps {
     comment: Comment
     currentUserId: string
     onReply?: () => void
     onEdit?: (content: string) => void
     onDelete?: () => void
     onReact?: (reaction: string) => void
     isThreaded?: boolean
   }
   ```

3. **CommentComposer.tsx**
   ```typescript
   interface CommentComposerProps {
     onSubmit: (content: string, options: CommentOptions) => void
     parentComment?: Comment
     mentions?: User[]
     allowAttachments?: boolean
     visibility?: CommentVisibility
   }
   ```

4. **CommentActions.tsx**
   - Reply button
   - Edit/Delete for own comments
   - Pin/Resolve for admins
   - Reaction picker
   - Share/Copy link

5. **CommentFilters.tsx**
   - Filter by visibility (all, internal, customer)
   - Filter by user
   - Filter by date range
   - Show only unresolved
   - Search within comments

## Phase 3: React Query Integration (Day 2-3)

### Hooks to Create:

```typescript
// Main hooks
useComments(entityType, entityId) // Fetch with pagination
useCommentThread(threadId) // Fetch single thread
useCreateComment() // Post new comment
useUpdateComment() // Edit comment
useDeleteComment() // Soft delete
useCommentReactions() // Manage reactions

// Real-time subscriptions
useCommentSubscription(entityType, entityId) // New comments
useReactionSubscription(commentId) // Reaction updates
useMentionNotifications(userId) // User mentions

// Utility hooks
useCommentSearch(query, filters)
useUnreadComments(entityType, entityId)
useMentionSuggestions(query) // For @mentions
```

## Phase 4: Real-time Features (Day 3)

### Implementation:

1. **Supabase Realtime Setup**
   ```typescript
   // Subscribe to new comments
   const channel = supabase
     .channel(`comments:${entityType}:${entityId}`)
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'comments',
       filter: `entity_type=eq.${entityType} AND entity_id=eq.${entityId}`
     }, handleNewComment)
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'comments'
     }, handleCommentUpdate)
     .subscribe()
   ```

2. **Optimistic Updates**
   - Immediate UI feedback
   - Rollback on error
   - Conflict resolution

3. **Presence Features**
   - Show who's viewing
   - Typing indicators
   - Online status

## Phase 5: Rich Features (Day 4)

### Features to Implement:

1. **Mentions System**
   - Parse @mentions in content
   - Autocomplete user suggestions
   - Notification on mention
   - Highlight mentions in UI

2. **File Attachments**
   - Drag & drop upload
   - Image preview
   - File type icons
   - Download links
   - Storage in Supabase Storage

3. **Markdown Support**
   - Bold, italic, code
   - Links auto-detection
   - Code blocks
   - Lists
   - Tables (optional)

4. **Reactions**
   - Emoji picker
   - Quick reactions (👍 👎 ❤️ 🎉)
   - Reaction counts
   - Hover to see who reacted

## Phase 6: Migration & Integration (Day 4-5)

### Migration Strategy:

1. **Data Migration Script**
   ```typescript
   // Migrate ticket_notes
   async function migrateTicketNotes() {
     const notes = await getTicketNotes()
     for (const note of notes) {
       await createComment({
         entity_type: 'ticket',
         entity_id: note.ticket_id,
         content: note.content,
         visibility: note.note_type === 'internal' ? 'internal' : 'customer',
         user_id: note.user_id,
         created_at: note.created_at,
         is_pinned: note.is_important
       })
     }
   }
   
   // Migrate appointment notes
   async function migrateAppointmentNotes() {
     const appointments = await getAppointments()
     for (const apt of appointments) {
       if (apt.notes) {
         const parsed = JSON.parse(apt.notes)
         if (parsed.customer_notes) {
           await createComment({
             entity_type: 'appointment',
             entity_id: apt.id,
             content: parsed.customer_notes,
             visibility: 'customer',
             created_at: apt.updated_at
           })
         }
         if (parsed.technician_notes) {
           await createComment({
             entity_type: 'appointment',
             entity_id: apt.id,
             content: parsed.technician_notes,
             visibility: 'internal',
             created_at: apt.updated_at
           })
         }
       }
     }
   }
   ```

2. **UI Integration**
   - Replace notes section in ticket details
   - Replace notes section in appointment details
   - Add to mobile views
   - Update API endpoints

## Phase 7: Polish & Optimization (Day 5)

### Performance Optimizations:
1. Virtual scrolling for long threads
2. Lazy load attachments
3. Cache rendered markdown
4. Debounce search
5. Pagination (20 comments initially)

### UX Enhancements:
1. Keyboard shortcuts
   - Ctrl+Enter to submit
   - Escape to cancel edit
   - / to search
2. Auto-save drafts
3. Smooth animations
4. Loading states
5. Error recovery

### Testing:
1. Unit tests for services
2. Component tests
3. E2E tests for workflows
4. Performance testing
5. Mobile testing

## Success Metrics

### Technical:
- Page load time < 200ms
- Real-time latency < 100ms
- Search response < 500ms
- 99.9% uptime

### User Experience:
- Increased engagement (comments per ticket)
- Reduced response time
- Higher user satisfaction
- Fewer support requests about notes

## Rollback Plan

1. Keep old tables for 30 days
2. Feature flag for gradual rollout
3. Data export functionality
4. Backup before migration
5. Rollback script prepared

## Future Enhancements

1. **AI Features**
   - Smart suggestions
   - Sentiment analysis
   - Auto-categorization
   - Summary generation

2. **Advanced Collaboration**
   - Video comments
   - Voice notes
   - Screen recordings
   - Co-editing

3. **Integrations**
   - Email replies
   - SMS notifications
   - Slack integration
   - Teams integration

4. **Analytics**
   - Response time metrics
   - Engagement analytics
   - Sentiment tracking
   - Team performance

## Timeline

- **Day 1**: Database, Repository, Service
- **Day 2**: Core UI Components
- **Day 3**: Real-time & React Query
- **Day 4**: Rich Features & Migration
- **Day 5**: Polish, Testing & Deployment

Total estimated time: 5 days for full implementation