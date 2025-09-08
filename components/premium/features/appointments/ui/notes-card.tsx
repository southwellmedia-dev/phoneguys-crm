'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabNav } from '@/components/premium/ui/navigation/tab-nav';
import { StatusBadge } from '@/components/premium/ui/badges/status-badge';
import { TextareaPremium } from '@/components/premium/ui/forms/textarea-premium';
import { cn } from '@/lib/utils';
import { 
  MessageSquare,
  FileText,
  AlertCircle,
  User,
  Clock,
  Edit
} from 'lucide-react';

export interface NotesData {
  customerNotes?: string;
  technicianNotes?: string;
  additionalIssues?: string;
  internalNotes?: string;
}

export interface NotesCardProps {
  /** Notes data */
  notes: NotesData;
  /** Whether in edit mode */
  isEditing?: boolean;
  /** Whether the form is locked */
  isLocked?: boolean;
  /** Callback for notes change */
  onNotesChange?: (notes: NotesData) => void;
  /** Custom className */
  className?: string;
}

export const NotesCard = React.forwardRef<HTMLDivElement, NotesCardProps>(
  ({ 
    notes,
    isEditing = false,
    isLocked = false,
    onNotesChange,
    className
  }, ref) => {
    const [activeTab, setActiveTab] = React.useState('customer');

    const handleNoteChange = (field: keyof NotesData, value: string) => {
      if (onNotesChange && !isLocked) {
        onNotesChange({
          ...notes,
          [field]: value
        });
      }
    };

    const tabs = [
      { 
        id: 'customer', 
        label: 'Customer Notes',
        icon: <User className="h-3.5 w-3.5" />,
        count: notes.customerNotes ? 1 : 0
      },
      { 
        id: 'technician', 
        label: 'Technician Notes',
        icon: <FileText className="h-3.5 w-3.5" />,
        count: notes.technicianNotes ? 1 : 0
      },
      { 
        id: 'issues', 
        label: 'Additional Issues',
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        count: notes.additionalIssues ? 1 : 0
      }
    ];

    return (
      <Card ref={ref} className={cn("relative", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">
                Notes & Documentation
              </CardTitle>
            </div>
            {isEditing && (
              <StatusBadge 
                type="general" 
                status="active" 
                variant="soft"
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editable
              </StatusBadge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            size="sm"
          />

          <div className="mt-4">
            {activeTab === 'customer' && (
              <div className="space-y-2">
                <TextareaPremium
                  label="Notes visible to customer"
                  value={notes.customerNotes || ''}
                  onChange={(e) => handleNoteChange('customerNotes', e.target.value)}
                  placeholder="Add notes that will be visible to the customer..."
                  rows={5}
                  disabled={!isEditing || isLocked}
                  variant="default"
                  size="sm"
                  info={notes.customerNotes && !isEditing ? 'Last updated' : undefined}
                />
              </div>
            )}

            {activeTab === 'technician' && (
              <div className="space-y-2">
                {notes.technicianNotes && !isEditing && (
                  <StatusBadge 
                    type="general" 
                    status="info" 
                    variant="soft"
                    className="text-xs mb-2"
                  >
                    Internal Only
                  </StatusBadge>
                )}
                <TextareaPremium
                  label="Internal technical notes"
                  value={notes.technicianNotes || ''}
                  onChange={(e) => handleNoteChange('technicianNotes', e.target.value)}
                  placeholder="Add internal notes about diagnosis, repairs, or technical details..."
                  rows={5}
                  disabled={!isEditing || isLocked}
                  variant="default"
                  size="sm"
                />
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-2">
                {notes.additionalIssues && !isEditing && (
                  <StatusBadge 
                    type="general" 
                    status="error" 
                    variant="soft"
                    className="text-xs mb-2"
                  >
                    Requires Attention
                  </StatusBadge>
                )}
                <TextareaPremium
                  label="Additional issues discovered"
                  value={notes.additionalIssues || ''}
                  onChange={(e) => handleNoteChange('additionalIssues', e.target.value)}
                  placeholder="Document any additional issues found during inspection..."
                  rows={5}
                  disabled={!isEditing || isLocked}
                  variant="default"
                  size="sm"
                  warning={notes.additionalIssues && !isEditing ? 'Additional issues require attention' : undefined}
                />
              </div>
            )}
          </div>

          {!isEditing && !notes.customerNotes && !notes.technicianNotes && !notes.additionalIssues && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notes added yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

NotesCard.displayName = 'NotesCard';