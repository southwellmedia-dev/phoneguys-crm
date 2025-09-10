"use client";

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { 
  MetricCard,
  StatCard,
  ButtonPremium,
  StatusBadge,
  CardPremium
} from '@/components/premium';
import { TabNav } from '@/components/premium/ui/navigation/tab-nav';
import { 
  Globe, 
  Code, 
  BarChart3, 
  FileText, 
  Settings,
  ExternalLink,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { FormPreview } from '@/components/website-integration/FormPreview';
import { FormSubmissions } from '@/components/website-integration/FormSubmissions';
import { IntegrationCode } from '@/components/website-integration/IntegrationCode';
import { WebsiteStatistics } from '@/components/website-integration/WebsiteStatistics';
import { IntegrationSettings } from '@/components/website-integration/IntegrationSettings';

export default function WebsiteIntegrationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'preview', label: 'Preview', icon: <Globe className="h-4 w-4" /> },
    { id: 'submissions', label: 'Submissions', icon: <FileText className="h-4 w-4" />, count: 12 },
    { id: 'integration', label: 'Integration', icon: <Code className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Submissions"
                value={284}
                change={12}
                trend="up"
                variant="default"
                icon={<FileText className="h-4 w-4" />}
                size="sm"
              />
              
              <StatCard
                title="Conversion Rate"
                value="68.2%"
                description="Submissions to appointments"
                variant="primary"
                icon={<Users className="h-4 w-4" />}
                size="sm"
              />

              <StatCard
                title="This Week"
                value={42}
                description="New appointments"
                variant="accent-cyan"
                icon={<Calendar className="h-4 w-4" />}
                size="sm"
              />

              <StatCard
                title="Avg Response"
                value="2.4h"
                description="Time to first contact"
                variant="accent-purple"
                icon={<Clock className="h-4 w-4" />}
                size="sm"
              />
            </div>

            {/* Advanced Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Weekly Submissions"
                value={142}
                change={23.5}
                trend="up"
                variant="inverted-primary"
                sparklineData={[30, 35, 25, 40, 45, 38, 42]}
              />

              <MetricCard
                title="Mobile vs Desktop"
                value="73%"
                description="Mobile form usage"
                variant="accent-cyan"
                sparklineData={[73, 70, 75, 71, 73, 76, 73]}
              />

              <MetricCard
                title="Peak Hours"
                value="2-5 PM"
                description="Most submissions"
                variant="accent-purple"
                sparklineData={[10, 15, 25, 35, 45, 40, 30]}
              />
            </div>

            <WebsiteStatistics />
          </div>
        );
        
      case 'preview':
        return (
          <div className="space-y-4">
            <CardPremium
              title="Live Form Preview"
              description="This is how your form appears to website visitors"
              variant="default"
            >
              <FormPreview />
            </CardPremium>
          </div>
        );
        
      case 'submissions':
        return (
          <div className="space-y-4">
            <FormSubmissions />
          </div>
        );
        
      case 'integration':
        return (
          <div className="space-y-4">
            <IntegrationCode />
          </div>
        );
        
      case 'settings':
        return (
          <div className="space-y-4">
            <IntegrationSettings />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Website Integration"
      description="Manage your embeddable appointment form and track website leads"
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge status="active" variant="soft" />
          <ButtonPremium
            variant="ghost"
            size="sm"
            icon={<ExternalLink className="h-4 w-4" />}
          >
            View Public Form
          </ButtonPremium>
        </div>
      }
    >
      <div className="space-y-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contrast"
          size="md"
        />
        
        {renderTabContent()}
      </div>
    </PageContainer>
  );
}