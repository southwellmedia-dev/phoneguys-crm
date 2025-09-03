import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthorizationService, Permission } from '@/lib/services/authorization.service';
import { User } from '@/lib/types/database.types';

export interface AuthContext {
  user: User;
  userId: string;
  role: string;
  permissions: Permission[];
  isAdmin: boolean;
  isManager: boolean;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'Unauthorized' };
    }
    
    return { user };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Require authentication for API route
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Get user details from database
  const supabase = await createClient();
  let { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If user doesn't exist by ID, check other methods
  if (dbError || !dbUser) {
    // Check if there's a mapping for this auth user
    const { data: mapping } = await supabase
      .from('user_id_mapping')
      .select('app_user_id')
      .eq('auth_user_id', user.id)
      .single();

    if (mapping) {
      // Use the mapped user ID
      const { data: mappedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', mapping.app_user_id)
        .single();
      
      if (mappedUser) {
        dbUser = mappedUser;
      }
    }

    // If still no user, try to find by email
    if (!dbUser) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email || '')
        .single();

      if (existingUser) {
        // User exists with different ID - create a mapping
        await supabase
          .from('user_id_mapping')
          .upsert({
            auth_user_id: user.id,
            app_user_id: existingUser.id
          });
        
        dbUser = existingUser;
      } else {
        // User doesn't exist at all - create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'technician' // Default role
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create user in users table:', createError);
          console.error('Error details:', { 
            authId: user.id, 
            email: user.email,
            metadata: user.user_metadata 
          });
          return NextResponse.json(
            { error: 'User setup failed. Please check console for details.' },
            { status: 500 }
          );
        }

        dbUser = newUser;
      }
    }
  }

  // Get permissions - use the dbUser.id which is the actual user record ID
  const authService = new AuthorizationService();
  const permissions = await authService.getUserPermissions(dbUser.id);
  const isAdmin = await authService.isAdmin(dbUser.id);
  const isManager = await authService.isManagerOrAbove(dbUser.id);

  return {
    user: dbUser,
    userId: dbUser.id, // Use the actual user table ID, not auth ID
    role: dbUser.role || 'technician',
    permissions,
    isAdmin,
    isManager
  };
}

/**
 * Require specific permission for API route
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  // If requireAuth returned an error response, return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const authContext = authResult as AuthContext;
  
  // Check permission
  if (!authContext.permissions.includes(permission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return authContext;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const authContext = authResult as AuthContext;
  
  // Check if user has at least one permission
  const hasPermission = permissions.some(p => 
    authContext.permissions.includes(p)
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return authContext;
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const authContext = authResult as AuthContext;
  
  if (!authContext.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return authContext;
}

/**
 * Require manager or admin role
 */
export async function requireManager(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const authContext = authResult as AuthContext;
  
  if (!authContext.isManager && !authContext.isAdmin) {
    return NextResponse.json(
      { error: 'Manager access required' },
      { status: 403 }
    );
  }

  return authContext;
}

/**
 * Check API key authentication (for external APIs)
 */
export async function checkApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return false;
  }

  // Check against environment variable
  // In production, this would check against database
  return apiKey === process.env.EXTERNAL_API_KEY;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Default error response
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

/**
 * Create success response with standard format
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status }
  );
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}