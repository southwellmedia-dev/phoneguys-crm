import { Suspense } from "react";
import { CustomersTable } from "./customers-table";
import { PageContainer } from "@/components/layout/page-container";
import { Plus, Download } from "lucide-react";
import { CustomerRepository } from "@/lib/repositories/customer.repository";

async function CustomersPageContent() {
  const customerRepo = new CustomerRepository();
  
  // Get all customers with repair count
  const customers = await customerRepo.findAllWithRepairCount();
  
  return <CustomersTable initialCustomers={customers} />;
}

export default async function CustomersPage() {
  const headerActions = [
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline" as const,
      href: "#", // TODO: Implement export functionality
    },
    {
      label: "New Customer",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
      href: "/customers/new",
    }
  ];

  return (
    <PageContainer
      title="Customers"
      description="Manage customer information and view repair history"
      actions={headerActions}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      }>
        <CustomersPageContent />
      </Suspense>
    </PageContainer>
  );
}