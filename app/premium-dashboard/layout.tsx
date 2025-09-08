import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PremiumLayout({
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

  // This layout provides NO additional structure
  // The ConnectedDashboard component handles everything including sidebar
  return <>{children}</>;
}