import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { HeaderProvider } from "@/lib/contexts/header-context";

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
  return (
    <HeaderProvider>
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar Navigation - Fixed to viewport height */}
        <Sidebar user={user} />

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
