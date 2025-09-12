import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentRepository } from '@/lib/repositories/comment.repository';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentIds } = await request.json();

    if (!commentIds || !Array.isArray(commentIds)) {
      return NextResponse.json(
        { error: 'commentIds array is required' },
        { status: 400 }
      );
    }

    // Filter out temporary IDs (non-UUID format)
    const validUUIDs = commentIds.filter(id => {
      // Basic UUID v4 validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    });

    if (validUUIDs.length === 0) {
      // No valid IDs to mark as read
      return NextResponse.json({ success: true });
    }

    // Use authenticated client for user operations
    const repo = new CommentRepository(supabase);
    
    await repo.markMultipleAsRead(validUUIDs, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking comments as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark comments as read' },
      { status: 500 }
    );
  }
}