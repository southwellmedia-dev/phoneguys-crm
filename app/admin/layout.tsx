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
  const userData = await userRepo.findByEmail(user.email || "");

  if (userData?.role !== "admin") {
    // Not authorized - redirect to dashboard
    redirect("/");
  }

  const userWithRole = {
    ...user,
    role: userData?.role || "technician",
    full_name: userData?.full_name || user.email?.split('@')[0] || 'User'
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

          {/* Main Content - Scrollable with light blue background in light mode */}
          <main className="flex-1 bg-primary/[0.03] dark:bg-muted/30 overflow-y-auto">
            <div className="bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.02] dark:from-muted/20 dark:via-transparent dark:to-muted/20 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}
