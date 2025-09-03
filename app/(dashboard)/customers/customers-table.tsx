'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Customer } from '@/lib/types/database.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Phone,
  Mail,
  User,
  Calendar,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CustomersTableProps {
  initialCustomers: Customer[];
}

export function CustomersTable({ initialCustomers }: CustomersTableProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Customer>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter((customer) => {
      const search = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [customers, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated repair tickets.')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setCustomers(customers.filter(c => c.id !== customerId));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (customers.length === 0 && !searchTerm) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No customers yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first customer to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/customers/new">
              Create Customer
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCustomers.length} of {customers.length} customers
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  Customer {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  Joined {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Repairs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No customers found matching your search
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Link 
                            href={`/customers/${customer.id}`}
                            className="font-medium hover:underline"
                          >
                            {customer.name}
                          </Link>
                          {customer.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                              {customer.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={`mailto:${customer.email}`}
                            className="hover:underline"
                          >
                            {customer.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={`tel:${customer.phone}`}
                            className="hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(customer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {customer.repair_count || 0} repairs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Customer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${customer.email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`tel:${customer.phone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Call Customer
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}