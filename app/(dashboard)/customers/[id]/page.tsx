import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerRepository } from "@/lib/repositories/customer.repository";
import { RepairTicketRepository } from "@/lib/repositories/repair-ticket.repository";
import { CustomerDetailClient } from "./customer-detail-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get customer details
  const customerRepo = new CustomerRepository();
  const customer = await customerRepo.findById(id);
  
  if (!customer) {
    notFound();
  }

  // Get customer's repair history
  const ticketRepo = new RepairTicketRepository();
  const repairs = await ticketRepo.findByCustomer(id);

  return (
    <CustomerDetailClient 
      customer={customer} 
      repairs={repairs}
      customerId={id}
    />
  );
}