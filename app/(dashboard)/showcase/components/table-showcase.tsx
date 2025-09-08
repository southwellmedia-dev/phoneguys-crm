"use client";

import { useState } from "react";
import { AdvancedTable as TablePremium, TableColumn } from "@/components/premium/ui/data-display/advanced-table";
import { StatusBadge } from "@/components/premium/ui/badges/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { Eye, Edit, Trash2 } from "lucide-react";

interface SampleData {
  id: string;
  ticketNumber: string;
  customer: string;
  device: string;
  status: 'new' | 'inProgress' | 'completed' | 'onHold';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  amount: number;
}

export function TableShowcase() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const sampleData: SampleData[] = [
    {
      id: '1',
      ticketNumber: 'TKT-001',
      customer: 'John Smith',
      device: 'iPhone 14 Pro',
      status: 'new',
      priority: 'high',
      createdAt: '2024-01-20',
      amount: 299.99
    },
    {
      id: '2',
      ticketNumber: 'TKT-002',
      customer: 'Sarah Johnson',
      device: 'Samsung S23',
      status: 'inProgress',
      priority: 'medium',
      createdAt: '2024-01-19',
      amount: 199.99
    },
    {
      id: '3',
      ticketNumber: 'TKT-003',
      customer: 'Mike Wilson',
      device: 'iPad Air',
      status: 'completed',
      priority: 'low',
      createdAt: '2024-01-18',
      amount: 349.99
    },
    {
      id: '4',
      ticketNumber: 'TKT-004',
      customer: 'Emily Davis',
      device: 'Google Pixel 7',
      status: 'onHold',
      priority: 'medium',
      createdAt: '2024-01-17',
      amount: 249.99
    },
  ];

  const columns: TableColumn<SampleData>[] = [
    {
      header: 'Ticket',
      accessorKey: 'ticketNumber',
      sortable: true,
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
      sortable: true,
    },
    {
      header: 'Device',
      accessorKey: 'device',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <StatusBadge status={row.status} variant="soft" />
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => {
        const colors = {
          high: 'text-red-500',
          medium: 'text-yellow-500',
          low: 'text-green-500'
        };
        return (
          <span className={`font-medium ${colors[row.priority]}`}>
            {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => `$${row.amount.toFixed(2)}`,
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <ButtonPremium size="xs" variant="soft" leftIcon={<Eye />}>
            View
          </ButtonPremium>
          <ButtonPremium size="xs" variant="soft" leftIcon={<Edit />}>
            Edit
          </ButtonPremium>
        </div>
      ),
    },
  ];

  const clickableColumns: TableColumn<SampleData>[] = columns.slice(0, -1); // Exclude actions column

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Table</CardTitle>
          <CardDescription>
            Clean fintech-style table with sorting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TablePremium
            data={sampleData}
            columns={columns}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clickable Rows</CardTitle>
          <CardDescription>
            Click any row to see the selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRow && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                Selected: <span className="font-medium">{selectedRow}</span>
              </p>
            </div>
          )}
          <TablePremium
            data={sampleData}
            columns={clickableColumns}
            onRowClick={(row) => setSelectedRow(row.ticketNumber)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empty State</CardTitle>
          <CardDescription>
            Table behavior with no data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TablePremium
            data={[]}
            columns={columns}
            emptyMessage="No tickets found"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Table Features</CardTitle>
          <CardDescription>
            Key features of the premium table component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold mb-2">Included Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Clean borders and hover states</li>
                <li>✓ Sortable columns with indicators</li>
                <li>✓ Clickable rows with navigation</li>
                <li>✓ Custom cell renderers</li>
                <li>✓ Empty state handling</li>
                <li>✓ Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Planned Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Column filtering</li>
                <li>• Pagination controls</li>
                <li>• Row selection with checkboxes</li>
                <li>• Column resizing</li>
                <li>• Export functionality</li>
                <li>• Virtual scrolling for large datasets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}