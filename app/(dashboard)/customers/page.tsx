import { CustomersTableLive } from "@/components/premium/connected/customers/customers-table-live";
import { PageContainer } from "@/components/layout/page-container";
import { Plus, Download } from "lucide-react";

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
      <CustomersTableLive />
    </PageContainer>
  );
}