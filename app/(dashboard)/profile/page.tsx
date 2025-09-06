import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from './profile-client';
import { PageContainer } from '@/components/layout/page-container';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // Get current user's ID
  const cookieStore = await cookies();
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user || error) {
    redirect('/auth/login');
  }

  // Get the app user ID from users table
  const { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single();

  const userId = appUser?.id || user.id;

  return (
    <Suspense fallback={
      <PageContainer
        title="Loading Profile..."
        description="Please wait while we load your profile"
      >
        <SkeletonTable rows={8} columns={4} showStats={true} />
      </PageContainer>
    }>
      <ProfileClient userId={userId} isOwnProfile={true} />
    </Suspense>
  );
}