import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "./order-detail-client";
import { createClient } from "@/lib/supabase/server";

async function getOrder(id: string) {
  const ticketRepo = new RepairTicketRepository(true); // Use service role for full access

  try {
    const order = await ticketRepo.getTicketWithDetails(id);
    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  // Get current user to check if they're admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Use UserRepository to get user details
  let isAdmin = false;
  if (user) {
    const userRepo = new UserRepository(true); // Use service role
    
    // First try to find by auth ID
    let dbUser = await userRepo.findById(user.id);
    
    // If not found by auth ID, check mapping table using service role
    if (!dbUser) {
      const { createServiceClient } = await import('@/lib/supabase/service');
      const serviceClient = createServiceClient();
      
      const { data: mapping } = await serviceClient
        .from('user_id_mapping')
        .select('app_user_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (mapping) {
        dbUser = await userRepo.findById(mapping.app_user_id);
      }
    }
    
    isAdmin = dbUser?.role === 'admin';
    console.log('Admin check:', { authId: user.id, dbUser: dbUser?.email, role: dbUser?.role, isAdmin });
  }

  const totalTimeMinutes = order.time_entries?.reduce(
    (acc: number, entry: any) => acc + (entry.duration_minutes || 0),
    0
  ) || 0;

  return (
    <OrderDetailClient 
      order={order} 
      orderId={params.id} 
      totalTimeMinutes={totalTimeMinutes}
      isAdmin={isAdmin}
    />
  );
}