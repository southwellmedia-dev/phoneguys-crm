"use client";

import { useState } from "react";
import { Service, ServiceCategory, SkillLevel } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/page-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  Wrench,
  DollarSign,
  Clock,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ServiceDialog } from "@/components/admin/service-dialog";

interface ServicesClientProps {
  initialServices: Service[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServiceUpdate = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? If it has been used in repairs, it will be deactivated instead. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete service');
      }

      toast.success("Service deleted successfully");
      setServices(services.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete service');
    }
  };

  const getCategoryColor = (category?: ServiceCategory) => {
    switch (category) {
      case 'screen_repair': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'battery_replacement': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'water_damage': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'diagnostic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'software_issue': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSkillLevelColor = (skillLevel?: SkillLevel) => {
    switch (skillLevel) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount?: number | null) => {
    return amount ? `$${amount.toFixed(2)}` : '-';
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCategoryName = (category?: ServiceCategory) => {
    return category?.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Other';
  };

  const headerActions = [
    {
      label: "Import",
      icon: <Upload className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Import services"),
    },
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Export services"),
    },
    {
      component: <ServiceDialog onSuccess={handleServiceUpdate} />,
    },
  ];

  return (
    <PageContainer
      title="Services Management"
      description="Manage repair services, pricing, and categories"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">
                Available services
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  services.reduce((sum, s) => sum + (s.base_price || 0), 0) / services.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Average service price
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Require Parts</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.requires_parts).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Services need parts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(
                  services.reduce((sum, s) => sum + (s.estimated_duration_minutes || 0), 0) / services.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Average duration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground">
                            {service.description.length > 60 
                              ? `${service.description.substring(0, 60)}...`
                              : service.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getCategoryColor(service.category)}>
                        {formatCategoryName(service.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(service.base_price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDuration(service.estimated_duration_minutes)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSkillLevelColor(service.skill_level)}>
                        {service.skill_level?.charAt(0).toUpperCase() + 
                         (service.skill_level?.slice(1) || '')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.requires_parts ? "default" : "secondary"}>
                        {service.requires_parts ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <ServiceDialog 
                            service={service} 
                            onSuccess={handleServiceUpdate}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Service
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Duplicate Service
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}