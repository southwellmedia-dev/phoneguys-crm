import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRepository } from "@/lib/repositories/user.repository";
import { HeaderProvider } from "@/lib/contexts/header-context";
import { Sidebar } from "@/components/layout/sidebar";
import { HeaderWrapper } from "@/components/layout/header-wrapper";

export default async function AdminLayout({
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

  // Check if user is admin
  const userRepo = new UserRepository();
  const userData = await userRepo.findByEmail(user.email || '');
  
  if (userData?.role !== 'admin') {
    // Not authorized - redirect to dashboard
    redirect("/");
  }

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