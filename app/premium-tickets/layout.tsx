import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { UserRepository } from "@/lib/repositories/user.repository";

export default async function PremiumTicketsLayout({
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
  
  // Get the mapped app user ID
  const { data: userMapping } = await supabase
    .from('user_id_mapping')
    .select('app_user_id')
    .eq('auth_user_id', user.id)
    .single();
  
  const userWithRole = {
    ...user,
    id: userMapping?.app_user_id || userData?.id || user.id,
    auth_id: user.id,
    role: userData?.role || 'technician',
    full_name: userData?.full_name || user.email?.split('@')[0] || 'User'
  };

  // Premium tickets pages use sidebar + content structure
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar user={userWithRole} />
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}