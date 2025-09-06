import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { UserService, InviteUserInput } from '@/lib/services/user.service';
import { z } from 'zod';

/**
 * Admin endpoint to invite new users to the system
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRepo = getRepository.users();
    const userData = await userRepo.findByEmail(user.email || '');
    
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Create UserService instance within request scope
    const userService = new UserService();
    
    // Invite the user
    const newUser = await userService.inviteUser(body as InviteUserInput);
    
    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User invitation sent successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error inviting user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten()
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}