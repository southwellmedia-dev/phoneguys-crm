"use client";

import { useState, useEffect } from 'react';
import { 
  CardPremium,
  ButtonPremium,
  StatusBadge,
  TablePremium,
  TablePremiumHeader,
  TablePremiumBody,
  TablePremiumRow,
  TablePremiumHead,
  TablePremiumCell,
  TablePremiumEmpty,
  InputPremium,
  DropdownPremium
} from '@/components/premium';
import { 
  Search, 
  MoreHorizontal, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface FormSubmission {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  device_info: any;
  issues: string[];
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'processed' | 'rejected';
  appointment_id?: string;
  source_url?: string;
  created_at: string;
}

export function FormSubmissions() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/form-submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (status: string): any => {
    const statusMap: Record<string, any> = {
      'pending': 'pending',
      'processed': 'success',
      'rejected': 'error'
    };
    return statusMap[status] || 'pending';
  };

  // Mock data for demonstration
  const mockSubmissions: FormSubmission[] = [
    {
      id: '1',
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      customer_phone: '(555) 123-4567',
      device_info: { name: 'iPhone 14 Pro', color: 'Space Black' },
      issues: ['Screen Repair', 'Battery Replacement'],
      preferred_date: '2024-01-15',
      preferred_time: '14:00',
      status: 'pending',
      source_url: 'https://clientsite.com/repair',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah@example.com',
      customer_phone: '(555) 987-6543',
      device_info: { name: 'Samsung Galaxy S23', color: 'Green' },
      issues: ['Charging Port'],
      preferred_date: '2024-01-14',
      preferred_time: '10:00',
      status: 'processed',
      appointment_id: 'APT-2024-0145',
      source_url: 'https://clientsite.com/services',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      customer_name: 'Mike Davis',
      customer_email: 'mike@example.com',
      customer_phone: '(555) 456-7890',
      device_info: { name: 'iPad Pro', color: 'Silver' },
      issues: ['Water Damage', 'Speaker Repair'],
      preferred_date: '2024-01-16',
      preferred_time: '16:30',
      status: 'pending',
      source_url: 'https://clientsite.com',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const displaySubmissions = submissions.length > 0 ? submissions : mockSubmissions;
  
  const filteredSubmissions = displaySubmissions.filter(submission => {
    if (filter !== 'all' && submission.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        submission.customer_name.toLowerCase().includes(query) ||
        submission.customer_email.toLowerCase().includes(query) ||
        submission.customer_phone.includes(query)
      );
    }
    return true;
  });

  const handleAction = (action: string, submission: FormSubmission) => {
    switch (action) {
      case 'view-customer':
        window.location.href = `/customers/${submission.customer_email}`;
        break;
      case 'convert':
        // Convert to appointment logic
        console.log('Converting to appointment:', submission.id);
        break;
      case 'reject':
        // Reject submission logic
        console.log('Rejecting submission:', submission.id);
        break;
      case 'view-appointment':
        if (submission.appointment_id) {
          window.location.href = `/appointments/${submission.appointment_id}`;
        }
        break;
    }
  };

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (submission: FormSubmission) => (
        <StatusBadge 
          status={getSubmissionStatus(submission.status)} 
          variant="soft"
        />
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (submission: FormSubmission) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{submission.customer_name}</div>
          <div className="text-xs text-muted-foreground">{submission.customer_email}</div>
          <div className="text-xs text-muted-foreground">{submission.customer_phone}</div>
        </div>
      )
    },
    {
      key: 'device',
      label: 'Device',
      render: (submission: FormSubmission) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{submission.device_info?.name}</div>
          {submission.device_info?.color && (
            <div className="text-xs text-muted-foreground">{submission.device_info.color}</div>
          )}
        </div>
      )
    },
    {
      key: 'issues',
      label: 'Issues',
      render: (submission: FormSubmission) => (
        <div className="flex flex-wrap gap-1">
          {submission.issues.map((issue, idx) => (
            <StatusBadge key={idx} status="info" variant="outline" className="text-xs">
              {issue}
            </StatusBadge>
          ))}
        </div>
      )
    },
    {
      key: 'appointment',
      label: 'Requested Time',
      render: (submission: FormSubmission) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {format(new Date(submission.preferred_date), 'MMM d')}
          <Clock className="h-3 w-3 ml-1" />
          {submission.preferred_time}
        </div>
      )
    },
    {
      key: 'source',
      label: 'Source',
      render: (submission: FormSubmission) => (
        submission.source_url ? (
          <a 
            href={submission.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cyan-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {new URL(submission.source_url).hostname}
          </a>
        ) : null
      )
    },
    {
      key: 'created',
      label: 'Submitted',
      render: (submission: FormSubmission) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(submission.created_at), 'MMM d, h:mm a')}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (submission: FormSubmission) => {
        const menuItems = [
          { label: 'View Customer', icon: User, action: 'view-customer' },
          ...(submission.status === 'pending' ? [
            { label: 'Convert to Appointment', icon: CheckCircle, action: 'convert', className: 'text-green-600' },
            { label: 'Reject', icon: XCircle, action: 'reject', className: 'text-red-600' }
          ] : []),
          ...(submission.appointment_id ? [
            { label: 'View Appointment', icon: ExternalLink, action: 'view-appointment' }
          ] : [])
        ];

        return (
          <DropdownPremium
            trigger={
              <ButtonPremium variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </ButtonPremium>
            }
            items={menuItems}
            onSelect={(action) => handleAction(action, submission)}
          />
        );
      }
    }
  ];

  return (
    <CardPremium
      title="Website Form Submissions"
      description="Appointments and inquiries from your embedded forms"
      variant="default"
      actions={
        <StatusBadge status="info" variant="soft">
          <Globe className="mr-1 h-3 w-3" />
          Website Leads
        </StatusBadge>
      }
    >
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <InputPremium
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            variant="default"
          />
        </div>
        <div className="flex gap-2">
          <ButtonPremium
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </ButtonPremium>
          <ButtonPremium
            variant={filter === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </ButtonPremium>
          <ButtonPremium
            variant={filter === 'processed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('processed')}
          >
            Processed
          </ButtonPremium>
          <ButtonPremium
            variant={filter === 'rejected' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </ButtonPremium>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading submissions...</div>
        </div>
      ) : (
        <TablePremium>
          <TablePremiumHeader>
            <TablePremiumRow>
              {columns.map((column) => (
                <TablePremiumHead key={column.key}>
                  {column.label}
                </TablePremiumHead>
              ))}
            </TablePremiumRow>
          </TablePremiumHeader>
          <TablePremiumBody>
            {filteredSubmissions.length === 0 ? (
              <TablePremiumRow>
                <TablePremiumCell colSpan={columns.length} className="text-center py-8">
                  <TablePremiumEmpty message="No form submissions yet" />
                </TablePremiumCell>
              </TablePremiumRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TablePremiumRow key={submission.id}>
                  {columns.map((column) => (
                    <TablePremiumCell key={column.key}>
                      {column.render ? column.render(submission) : null}
                    </TablePremiumCell>
                  ))}
                </TablePremiumRow>
              ))
            )}
          </TablePremiumBody>
        </TablePremium>
      )}
    </CardPremium>
  );
}