import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CommentRepository } from '@/lib/repositories/comment.repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;
    const { reaction } = await request.json();

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction is required' },
        { status: 400 }
      );
    }

    // Use authenticated client for user operations
    const repo = new CommentRepository(supabase);
    
    const result = await repo.addReaction(commentId, reaction);

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error adding reaction:', error);
    
    // Check for duplicate reaction error
    if (error.message?.includes('already reacted')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;
    const { reaction } = await request.json();

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction is required' },
        { status: 400 }
      );
    }

    // Use authenticated client for user operations
    const repo = new CommentRepository(supabase);
    
    await repo.removeReaction(commentId, reaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}