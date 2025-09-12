import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentRepository } from '@/lib/repositories/comment.repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
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
    
    const stats = await repo.getCommentStats(
      entityType as any,
      entityId
    );
    
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment stats' },
      { status: 500 }
    );
  }
}