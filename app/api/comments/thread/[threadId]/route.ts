import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentRepository } from '@/lib/repositories/comment.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Use authenticated client for user operations
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const repo = new CommentRepository(supabase);
    
    const thread = await repo.getThread(threadId);
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: thread });
  } catch (error) {
    console.error('Error fetching comment thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment thread' },
      { status: 500 }
    );
  }
}