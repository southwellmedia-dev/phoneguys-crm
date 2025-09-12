import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { HeaderWrapperPremium } from "@/components/layout/header-wrapper-premium";
import { HeaderProvider } from "@/lib/contexts/header-context";
import { UserRepository } from "@/lib/repositories/user.repository";
import { SearchWrapper } from "@/components/layout/search-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/auth/login");
  }

  // Fetch the user's role and full name from the users table
  const userRepo = new UserRepository();
  const userData = await userRepo.findByEmail(user.email || '');
  
  // Note: user_id_mapping table is only for legacy user migration
  // For normal users, we use the userData directly
  
  const userWithRole = {
    ...user,
    id: userData?.id || user.id, // Use the user data ID
    auth_id: user.id, // Keep auth ID for reference
    role: userData?.role || 'technician',
    full_name: userData?.full_name || user.email?.split('@')[0] || 'User'
  };
  return (
    <SearchWrapper>
      <HeaderProvider>
        <div className="h-screen flex overflow-hidden bg-background">
          {/* Sidebar Navigation - Fixed to viewport height */}
          <Sidebar user={userWithRole} />

          {/* Main Content Area - Scrollable */}
          <div className="flex-1 flex flex-col h-screen">
            {/* Premium Header with enhanced features - h-20 to match sidebar */}
            <HeaderWrapperPremium />

            {/* Main Content - Scrollable with light blue background in light mode */}
            <main className="flex-1 bg-primary/[0.03] dark:bg-muted/30 overflow-y-auto">
              <div className="bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.02] dark:from-muted/20 dark:via-transparent dark:to-muted/20 min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </HeaderProvider>
    </SearchWrapper>
  );
}
