'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';

export function useUserSearch(query: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 1) {
        return [];
      }

      const { data, error } = await supabase
        .rpc('search_users_by_username', { search_query: query });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data as Array<{
        id: string;
        username: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        role: string;
      }>;
    },
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}