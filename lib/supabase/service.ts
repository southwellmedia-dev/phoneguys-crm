import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role key for bypassing RLS
 * This should only be used in secure server-side contexts
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // For local development, use the local service role key
  // This key bypasses RLS policies completely
  const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  // Check if we're in local development (URL contains 127.0.0.1 or localhost)
  const isLocal = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost');
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  // Use local service key for local development
  if (isLocal) {
    return createSupabaseClient(supabaseUrl, localServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // For production, use the service role key from environment
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    // Fallback to anon key if service role key is not set
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    
    if (!supabaseAnonKey) {
      throw new Error('Missing Supabase API keys');
    }

    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}