import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Optimized admin auth check that uses session data instead of database lookups
 * This is MUCH faster than checking the database on every request
 */
export async function checkAdminAuthOptimized() {
  try {
    const supabase = await createClient();
    
    // Get user from session (no network call if session is valid)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role in their JWT metadata
    // This avoids the database lookup entirely
    const userMetadata = user.user_metadata;
    const appMetadata = user.app_metadata;
    
    // Check both metadata locations where role might be stored
    const role = appMetadata?.role || userMetadata?.role;
    
    if (role !== 'admin') {
      // Only do database check if role is not in metadata
      // This is a fallback for older users
      if (!role) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
          
        if (userData?.role !== 'admin') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }
    
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

/**
 * Cache auth results for a short time to avoid repeated checks
 */
const authCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function checkAdminAuthCached(userId?: string) {
  if (!userId) {
    return checkAdminAuthOptimized();
  }
  
  const cached = authCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const result = await checkAdminAuthOptimized();
  authCache.set(userId, { result, timestamp: Date.now() });
  
  // Clean up old cache entries
  if (authCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of authCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        authCache.delete(key);
      }
    }
  }
  
  return result;
}