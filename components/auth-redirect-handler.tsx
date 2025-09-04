'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if we have invite tokens in the URL fragment
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      // If this is an invite type with tokens, redirect to accept-invitation
      if (type === 'invite' && accessToken) {
        // Preserve the full hash for the accept-invitation page
        const newUrl = `/auth/accept-invitation${window.location.hash}`;
        router.replace(newUrl);
      }
    }
  }, [router]);

  return null;
}