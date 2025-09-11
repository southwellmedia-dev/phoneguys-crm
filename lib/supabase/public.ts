import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for public API endpoints
 * This client uses the anon key without any cookie-based authentication
 * Perfect for public forms and unauthenticated access
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create a client without any auth persistence or cookies
  // This ensures we're using pure anon role access
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  // Log to verify we're using the anon key
  console.log('Public client created with URL:', supabaseUrl);
  
  return client;
}