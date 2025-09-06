import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Maps an auth user ID to an app user ID using the user_id_mapping table
 * @param supabase - Supabase client instance
 * @param authUserId - The auth user ID to map
 * @returns The app user ID if mapping exists, otherwise returns the auth user ID
 */
export async function getAppUserId(
  supabase: SupabaseClient,
  authUserId: string
): Promise<string> {
  const { data: mapping } = await supabase
    .from('user_id_mapping')
    .select('app_user_id')
    .eq('auth_user_id', authUserId)
    .single();

  return mapping?.app_user_id || authUserId;
}

/**
 * Gets the current user's app user ID and role
 * @param supabase - Supabase client instance
 * @returns Object with appUserId and role, or null if not authenticated
 */
export async function getCurrentUserInfo(supabase: SupabaseClient): Promise<{
  authUserId: string;
  appUserId: string;
  role: string;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const appUserId = await getAppUserId(supabase, user.id);
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', appUserId)
    .single();

  return {
    authUserId: user.id,
    appUserId,
    role: userData?.role || 'technician'
  };
}