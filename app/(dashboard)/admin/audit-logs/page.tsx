'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Shield, User, Search, Filter, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  activity_type: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface AuditFilters {
  userId?: string;
  activityType?: string;
  entityType?: string;
  dateRange?: string;
  search?: string;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Fetch audit logs
  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== '')
        )
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute for real-time updates
  });

  // Fetch summary stats
  const { data: statsData } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/audit-logs/stats');
      if (!response.ok) throw new Error('Failed to fetch audit stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const auditLogs = auditData?.data || [];
  const totalCount = auditData?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Activity type badges
  const getActivityBadge = (activityType: string) => {
    if (activityType.startsWith('security_')) {
      return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />{activityType}</Badge>;
    } else if (activityType.startsWith('user_')) {
      return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" />{activityType}</Badge>;
    } else if (activityType.startsWith('ticket_') || activityType.startsWith('customer_')) {
      return <Badge variant="default" className="gap-1">{activityType}</Badge>;
    }
    return <Badge variant="outline">{activityType}</Badge>;
  };

  // Risk level indicator
  const getRiskIndicator = (details: any) => {
    const riskLevel = details?.risk_level;
    if (!riskLevel) return null;

    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500', 
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };

    return (
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${colors[riskLevel as keyof typeof colors] || 'bg-gray-400'}`} />
        <span className="text-xs text-muted-foreground capitalize">{riskLevel}</span>
      </div>
    );
  };

  // Export audit logs
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== '')
        ),
        export: 'true'
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Define header actions
  const headerActions = [
    {
      label: "Export Logs",
      onClick: handleExport,
      variant: "outline" as const,
      icon: <Download className="h-4 w-4" />
    }
  ];

  return (
    <PageContainer
      title="Audit Logs"
      description="Monitor system activities, security events, and user actions"
      actions={headerActions}
    >
      <div className="space-y-6">

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.totalActivities?.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.securityEvents?.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(statsData?.data?.criticalEvents ?? 0) > 0 && (
                <span className="text-red-600">
                  {statsData?.data?.criticalEvents} critical
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.activeUsers?.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">With recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.data?.failedLogins?.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search activity..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select
                value={filters.activityType || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, activityType: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activities</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_updated">User Updated</SelectItem>
                  <SelectItem value="ticket_created">Ticket Created</SelectItem>
                  <SelectItem value="ticket_status_changed">Ticket Status Changed</SelectItem>
                  <SelectItem value="security_login_success">Login Success</SelectItem>
                  <SelectItem value="security_login_failure">Login Failure</SelectItem>
                  <SelectItem value="security_permission_denied">Permission Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={filters.entityType || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={filters.dateRange || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button 
                  onClick={() => { setPage(1); refetch(); }}
                  size="sm"
                  className="gap-1"
                >
                  <Search className="h-3 w-3" />
                  Search
                </Button>
                <Button 
                  onClick={() => { setFilters({}); setPage(1); }}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Audit Log Entries
              <span className="text-sm font-normal text-muted-foreground">
                {totalCount.toLocaleString()} total entries
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(10)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No audit logs found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log: AuditLog) => (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedLog(log)}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user?.full_name || 'System'}</span>
                            <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getActivityBadge(log.activity_type)}</TableCell>
                        <TableCell>
                          {log.entity_type && (
                            <div className="flex flex-col">
                              <span className="font-medium capitalize">{log.entity_type}</span>
                              {log.entity_id && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {log.entity_id.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getRiskIndicator(log.details)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Details Panel */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Log Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Activity Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Type:</strong> {getActivityBadge(selectedLog.activity_type)}</div>
                      <div><strong>Timestamp:</strong> {format(new Date(selectedLog.created_at), 'PPpp')}</div>
                      <div><strong>User:</strong> {selectedLog.user?.full_name || 'System'}</div>
                      {selectedLog.user?.email && (
                        <div><strong>Email:</strong> {selectedLog.user.email}</div>
                      )}
                      {selectedLog.user?.role && (
                        <div><strong>Role:</strong> <Badge variant="outline">{selectedLog.user.role}</Badge></div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-2">Entity Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Type:</strong> {selectedLog.entity_type || 'N/A'}</div>
                      <div><strong>ID:</strong> <code className="text-xs">{selectedLog.entity_id || 'N/A'}</code></div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-2">Details</h4>
                    <div className="text-xs">
                      <pre className="whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a log entry to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </PageContainer>
  );
}