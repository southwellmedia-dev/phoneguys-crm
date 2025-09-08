import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { notFound } from "next/navigation";
import { PremiumTicketDetailClient } from "./premium-ticket-detail-client";
import { createClient } from "@/lib/supabase/server";

async function getTicket(id: string) {
  const ticketRepo = new RepairTicketRepository(true);
  
  try {
    const ticket = await ticketRepo.getTicketWithDetails(id);
    return ticket;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return userData;
}

export default async function PremiumTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [ticket, user] = await Promise.all([
    getTicket(resolvedParams.id),
    getUser()
  ]);

  if (!ticket) {
    notFound();
  }

  return (
    <PremiumTicketDetailClient 
      ticket={ticket} 
      user={user}
      userRole={user?.role || "technician"}
    />
  );
}