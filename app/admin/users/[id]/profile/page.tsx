import { Suspense } from 'react';
import { UserProfileClient } from './profile-client';
import { PageContainer } from '@/components/layout/page-container';
import { SkeletonTable } from '@/components/ui/skeleton-table';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={
      <PageContainer
        title="Loading Profile..."
        description="Please wait while we load the user profile"
      >
        <SkeletonTable rows={8} columns={4} showStats={true} />
      </PageContainer>
    }>
      <UserProfileClient userId={id} />
    </Suspense>
  );
}