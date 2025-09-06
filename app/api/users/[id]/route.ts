import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission, AuthorizationService } from '@/lib/services/authorization.service';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// Validation schema for updating user
const updateUserSchema = z.object({
  role: z.enum(['admin', 'manager', 'technician']).optional(),
  is_active: z.boolean().optional(),
  metadata: z.object({
    full_name: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional()
  }).optional()
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication and user view permission
    const authResult = await requirePermission(request, Permission.USER_VIEW);
    if (authResult instanceof NextResponse) return authResult;

    const userId = params.id;
    
    // Get repository instance using singleton manager
    const userRepo = getRepository.users();
    const user = await userRepo.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      metadata: user.metadata,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };

    return successResponse(sanitizedUser);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication and user update permission
    const authResult = await requirePermission(request, Permission.USER_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const userId = params.id;
    const body = await request.json();

    // Validate input
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten() 
        },
        { status: 400 }
      );
    }

    // Check if user can modify this user
    const authService = new AuthorizationService();
    const canModify = await authService.canModifyUser(authResult.userId, userId);
    
    if (!canModify) {
      return NextResponse.json(
        { error: 'Cannot modify this user' },
        { status: 403 }
      );
    }

    // If changing role, check permission
    if (validation.data.role) {
      const hasPermission = await authService.hasPermission(
        authResult.userId,
        Permission.USER_CHANGE_ROLE
      );
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Cannot change user role' },
          { status: 403 }
        );
      }
    }

    // Get repository instance using singleton manager
    const userRepo = getRepository.users();

    // Update user
    const updatedUser = await userRepo.update(userId, validation.data);

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication and user delete permission
    const authResult = await requirePermission(request, Permission.USER_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const userId = params.id;
    
    // Prevent self-deletion
    if (userId === authResult.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user can delete this user
    const authService = new AuthorizationService();
    const canModify = await authService.canModifyUser(authResult.userId, userId);
    
    if (!canModify) {
      return NextResponse.json(
        { error: 'Cannot delete this user' },
        { status: 403 }
      );
    }

    // Get repository instance using singleton manager
    const userRepo = getRepository.users();

    // Soft delete (mark as inactive)
    await userRepo.update(userId, { is_active: false });

    return successResponse(null, 'User deactivated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}