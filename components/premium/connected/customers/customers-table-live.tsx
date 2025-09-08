/**
 * CustomersTableLive - Connected customers table with real-time updates
 * 
 * @description Data-aware customers table with metrics and real-time updates
 * @category Connected/Customers
 */

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Mail,
  User,
  Calendar,
  Package,
  Users,
  TrendingUp,
  Activity,
  UserCheck,
  Star,
  RefreshCw,
  Shield
} from 'lucide-react';
import { TablePremiumLive } from '@/components/premium/connected/data-display/table-premium-live';
import { MetricCardLive } from '@/components/premium/connected/dashboard/metric-card-live';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { useDeleteCustomer } from '@/lib/hooks/use-customers';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface CustomersTableLiveProps {
  className?: string;
}

export function CustomersTableLive({ className }: CustomersTableLiveProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const deleteCustomer = useDeleteCustomer();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
        
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
      }
    };
    checkAdminStatus();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Column definitions for the table
  const columns = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Link 
              href={`/customers/${row.id}`}
              className="font-medium hover:underline"
            >
              {value}
            </Link>
            {row.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                {row.notes}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (_: any, row: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <a 
              href={`mailto:${row.email}`}
              className="hover:underline"
            >
              {row.email}
            </a>
          </div>
          {row.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <a 
                href={`tel:${row.phone}`}
                className="hover:underline"
              >
                {row.phone}
              </a>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'repair_count',
      label: 'Repairs',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">
            {value || 0} repairs
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right' as const,
      render: (_: any, row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/customers/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/customers/${row.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`mailto:${row.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </a>
            </DropdownMenuItem>
            {row.phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${row.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Customer
                </a>
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DeleteCustomerDialog
                  customerId={row.id}
                  customerName={row.name}
                  trigger={
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Delete Customer (Admin)
                    </DropdownMenuItem>
                  }
                  onSuccess={() => {
                    // Real-time subscription will handle the update
                  }}
                />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metric Cards - Using connected components */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCardLive
          metric="total_customers"
          title="Total Customers"
          icon={<Users />}
          variant="default"
          subtitle="Registered customers"
        />

        <MetricCardLive
          metric="active_customers"
          title="Active Customers"
          icon={<UserCheck />}
          variant="success"
          subtitle="With repair history"
        />

        <MetricCardLive
          metric="total_repairs"
          title="Total Repairs"
          icon={<Package />}
          variant="inverted-primary"
          subtitle="All time repairs"
        />

        <MetricCardLive
          metric="new_customers_month"
          title="New This Month"
          icon={<Star />}
          variant="warning"
          subtitle="Recent registrations"
        />
      </div>

      {/* Customer List Card */}
      <Card className="relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:from-primary/20 transition-colors duration-500" />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Customer Directory
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Managing customer relationships
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="rounded-xl overflow-hidden">
            <TablePremiumLive
              endpoint="/api/customers"
              queryKey={["customers", searchTerm]}
              columns={columns}
              filters={searchTerm ? { search: searchTerm } : undefined}
              initialSort={{ key: 'created_at', direction: 'desc' }}
              emptyState={{
                message: searchTerm ? "No customers found" : "No customers yet",
                description: searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create your first customer to get started",
                icon: <User className="h-12 w-12 text-muted-foreground/50" />
              }}
              className="table-modern"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}