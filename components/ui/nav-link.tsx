'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { navigationStore } from '@/lib/stores/navigation-store';
import { forwardRef } from 'react';

interface NavLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
}

/**
 * A wrapper around Next.js Link that triggers loading state BEFORE navigation
 * This prevents content flash before skeleton appears
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ children, href, onClick, ...props }, ref) => {
    const router = useRouter();
    
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't trigger for external links or hash links
      const isExternal = typeof href === 'string' && (href.startsWith('http') || href.startsWith('//'));
      const isHash = typeof href === 'string' && href.startsWith('#');
      
      if (!isExternal && !isHash) {
        // Start navigation loading state immediately
        navigationStore.startNavigation();
      }
      
      // Call original onClick if provided
      if (onClick) {
        onClick(e);
      }
    };
    
    return (
      <Link ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
    );
  }
);

NavLink.displayName = 'NavLink';