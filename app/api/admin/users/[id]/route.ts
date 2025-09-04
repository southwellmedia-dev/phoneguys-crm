import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories/user.repository';
import { UserService } from '@/lib/services/user.service';

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRepo = new UserRepository();
  const userData = await userRepo.findByEmail(user.email || '');
  
  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}

/**
 * Delete a user completely from both auth and database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create UserService instance within request scope
    const userService = new UserService();
    
    // Delete the user
    await userService.deleteUser(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }, { status: 500 });
  }
}