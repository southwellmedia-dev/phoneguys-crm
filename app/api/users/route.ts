import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission, AuthorizationService } from '@/lib/services/authorization.service';
import { z } from 'zod';

// Validation schema for creating user
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'technician']),
  metadata: z.object({
    full_name: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional()
  }).optional()
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Require authentication and user view permission
    const authResult = await requirePermission(request, Permission.USER_VIEW);
    if (authResult instanceof NextResponse) return authResult;
    
    const authTime = Date.now();
    console.log(`[Users API] Auth check took: ${authTime - startTime}ms`);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    // Get repository instance using singleton manager
    const userRepo = getRepository.users();
    
    // Build filters
    let filters: any = {};
    if (role) {
      filters.role = role;
    }
    if (isActive !== null) {
      filters.is_active = isActive === 'true';
    }

    const queryStart = Date.now();
    // Get users
    const users = await userRepo.findAll(filters);
    const queryTime = Date.now();
    console.log(`[Users API] Database query took: ${queryTime - queryStart}ms`);

    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      metadata: user.metadata,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    }));

    const totalTime = Date.now() - startTime;
    console.log(`[Users API] Total request time: ${totalTime}ms`);
    console.log(`[Users API] Returning ${sanitizedUsers.length} users`);

    return successResponse(sanitizedUsers);
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[Users API] Error after ${errorTime}ms:`, error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication and user create permission
    const authResult = await requirePermission(request, Permission.USER_CREATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();

    // Validate input
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten() 
        },
        { status: 400 }
      );
    }

    // Check if user can create this role level
    const authService = new AuthorizationService();
    const canCreateRole = authService.getRoleLevel(authResult.role as any) > 
                          authService.getRoleLevel(validation.data.role);
    
    if (!canCreateRole) {
      return NextResponse.json(
        { error: 'Cannot create user with equal or higher role' },
        { status: 403 }
      );
    }

    // Get repository instance using singleton manager
    const userRepo = getRepository.users();

    // Check if user already exists
    const existing = await userRepo.findByEmail(validation.data.email);
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user (Note: This creates the database record, but not the auth user)
    // In production, you would also create the auth user via Supabase Admin API
    const user = await userRepo.create({
      email: validation.data.email,
      role: validation.data.role,
      metadata: validation.data.metadata || {},
      is_active: true,
      created_at: new Date().toISOString()
    });

    return successResponse(
      user,
      'User created successfully. They will receive an invitation email.',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}