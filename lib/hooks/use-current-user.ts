'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export function useCurrentUser() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<User | null> => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return null;
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      return {
        id: authUser.id,
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: profile?.role || 'Technician', // Default role
        avatar_url: profile?.avatar_url
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
}