import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { HeaderProvider } from "@/lib/contexts/header-context";
import { UserRepository } from "@/lib/repositories/user.repository";

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

  // Fetch the user's role from the users table
  const userRepo = new UserRepository();
  const userData = await userRepo.findByEmail(user.email || '');
  const userWithRole = {
    ...user,
    role: userData?.role || 'technician'
  };
  return (
    <HeaderProvider>
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar Navigation - Fixed to viewport height */}
        <Sidebar user={userWithRole} />

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Top Header with dynamic content */}
          <HeaderWrapper />

          {/* Main Content - Scrollable */}
          <main className="flex-1 bg-background overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}
