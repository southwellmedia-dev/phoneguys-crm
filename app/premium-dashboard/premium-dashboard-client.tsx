"use client";

import { PremiumDashboardLayout } from './premium-dashboard-layout';

interface PremiumDashboardClientProps {
  user: any;
}

export function PremiumDashboardClient({ user }: PremiumDashboardClientProps) {
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
    <PremiumDashboardLayout
      user={user}
      userName={user.full_name}
      userRole={user.role}
      variant={getDashboardVariant(user.role)}
    />
  );
}