"use client";

import { ConnectedDashboard } from './connected-dashboard';

/**
 * Dashboard Usage Examples
 * 
 * These examples show how to use the ConnectedDashboard component
 * for different user roles and use cases.
 */

// Example 1: Standard Technician Dashboard
export function TechnicianDashboardExample() {
  return (
    <ConnectedDashboard
      userName="John Smith"
      userRole="Technician" 
      variant="technician"
    />
  );
}

// Example 2: Manager Overview Dashboard
export function ManagerDashboardExample() {
  return (
    <ConnectedDashboard
      userName="Sarah Johnson"
      userRole="Manager"
      variant="overview"
    />
  );
}

// Example 3: Executive Analytics Dashboard  
export function ExecutiveDashboardExample() {
  return (
    <ConnectedDashboard
      userName="Michael Chen"
      userRole="Admin"
      variant="executive"
    />
  );
}

// Example 4: Analytics-focused Dashboard
export function AnalyticsDashboardExample() {
  return (
    <ConnectedDashboard
      userName="Data Analyst"
      userRole="Manager" 
      variant="analytics"
    />
  );
}

// Example 5: Custom Dashboard Implementation
export function CustomDashboardExample() {
  // You can also use individual components for custom layouts
  const { DashboardGrid, ConnectedMetricCard, ConnectedStatCard } = require('./index');
  
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Custom Dashboard Layout</h1>
      
      {/* Mix and match components */}
      <div className="grid gap-4 md:grid-cols-3">
        <ConnectedMetricCard metric="revenue" priority="high" />
        <ConnectedStatCard metric="pending" variant="gradient-border" />
        <ConnectedMetricCard metric="completed_today" />
      </div>
      
      {/* Use the grid for standard layout */}
      <DashboardGrid layout="compact" />
    </div>
  );
}

/**
 * How to use in your pages:
 * 
 * // pages/dashboard.tsx
 * import { ConnectedDashboard } from '@/components/premium/connected';
 * 
 * export default function DashboardPage() {
 *   // Get user data from your auth system
 *   const user = getCurrentUser(); // Your auth implementation
 *   
 *   return (
 *     <ConnectedDashboard
 *       userName={user.name}
 *       userRole={user.role}
 *       variant="overview" // or "analytics", "executive", "technician"
 *     />
 *   );
 * }
 */