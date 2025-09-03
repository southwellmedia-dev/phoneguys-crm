import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditCustomerClient from './edit-customer-client';
import { CustomerRepository } from '@/lib/repositories/customer.repository';

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCustomer(customerId: string) {
  const customerRepo = new CustomerRepository();
  const customer = await customerRepo.findById(customerId);
  return customer;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const resolvedParams = await params;
  const customer = await getCustomer(resolvedParams.id);
  
  if (!customer) {
    notFound();
  }
  
  return <EditCustomerClient customer={customer} />;
}