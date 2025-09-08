import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRepository } from "@/lib/repositories/user.repository";
import { PremiumDashboardClient } from "./premium-dashboard-client";

export default async function PremiumDashboardPage() {
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

  return <PremiumDashboardClient user={userWithRole} />;
}