import { CustomersTable } from "./customers-table";
import { PageContainer } from "@/components/layout/page-container";
import { Plus, Download } from "lucide-react";
import { CustomerRepository } from "@/lib/repositories/customer.repository";

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

  // Get customers data
  const customerRepo = new CustomerRepository();
  const customers = await customerRepo.findAllWithRepairCount();

  return (
    <PageContainer
      title="Customers"
      description="Manage customer information and view repair history"
      actions={headerActions}
    >
      <CustomersTable initialCustomers={customers} />
    </PageContainer>
  );
}