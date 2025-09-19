import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

export default function ReportsLoading() {
  return (
    <PageContainer
      title="Reports & Analytics"
      description="Comprehensive business insights and performance metrics"
      icon={<BarChart3 className="h-8 w-8" />}
    >
      {/* Date Range and Export Controls Skeleton */}
      <Skeleton className="h-24 mb-6" />

      {/* Quick Stats Skeleton */}
      <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-12 mb-4" />

      {/* Content Area Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    </PageContainer>
  );
}