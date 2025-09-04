'use client';

import { createContext, useContext, useState, useEffect, useRef, useTransition } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextType>({ isNavigating: false });

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    // If pathname changed, we navigated
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setIsNavigating(false); // Navigation complete
    }
  }, [pathname]);
  
  // Set navigating true when transition starts
  useEffect(() => {
    if (isPending) {
      setIsNavigating(true);
    }
  }, [isPending]);
  
  return (
    <NavigationContext.Provider value={{ isNavigating: isNavigating || isPending }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}