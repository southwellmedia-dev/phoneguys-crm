"use client";

import { DashboardContent } from './dashboard-content';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

export function NewDashboard() {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) {
    return <SkeletonDashboard />;
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Determine dashboard variant based on user role
  const getDashboardVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'owner':
        return 'executive';
      case 'manager':
        return 'analytics';
      case 'technician':
        return 'technician';
      default:
        return 'overview';
    }
  };
  
  return (
    <DashboardContent
      variant={getDashboardVariant(user.role)}
    />
  );
}