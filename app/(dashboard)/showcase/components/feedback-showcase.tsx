"use client";

import { useState } from "react";
import { AlertPremium } from "@/components/premium/ui/feedback/alert-premium";
import { ToastPremium, ToastContainer, useToast } from "@/components/premium/ui/feedback/toast-premium";
import { ProgressBar, SegmentedProgressBar } from "@/components/premium/ui/feedback/progress-bar";
import { LoadingSpinner, LoadingInline } from "@/components/premium/ui/feedback/loading-spinner";
import { 
  SkeletonPremium, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList,
  SkeletonForm 
} from "@/components/premium/ui/feedback/skeleton-premium";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { CheckCircle, AlertCircle, Info, AlertTriangle, XCircle, Eye, Settings } from "lucide-react";

export function FeedbackShowcase() {
  const [progress, setProgress] = useState(65);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const showExampleToast = (variant: string) => {
    setShowToast(variant);
    setTimeout(() => setShowToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      {showToast && (
        <ToastContainer position="bottom-right">
          <ToastPremium
            variant={showToast as any}
            title="Notification"
            description={`This is a ${showToast} toast notification with fintech styling.`}
            duration={5000}
            showProgress
            onClose={() => setShowToast(null)}
          />
        </ToastContainer>
      )}

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Components</CardTitle>
          <CardDescription>
            Clean, fintech-style alerts with minimal design and strategic color use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <AlertPremium
              variant="default"
              title="System Update Available"
              description="A new system update is available. Please restart to apply changes."
              closable
            />
            
            <AlertPremium
              variant="primary"
              title="Account Verification Required" 
              description="Please verify your account to unlock all features."
              action={
                <ButtonPremium size="sm" variant="outline">
                  Verify Now
                </ButtonPremium>
              }
            />

            <AlertPremium
              variant="success"
              title="Payment Processed Successfully"
              description="Your payment of $299.99 has been processed successfully."
              closable
            />

            <AlertPremium
              variant="warning"
              title="Approaching Storage Limit"
              description="You're using 85% of your storage quota. Consider upgrading your plan."
            />

            <AlertPremium
              variant="error"
              title="Connection Failed"
              description="Unable to connect to the server. Please check your internet connection."
              closable
            />

            <AlertPremium
              variant="soft-info"
              title="Maintenance Scheduled"
              description="System maintenance is scheduled for tonight from 2-4 AM EST."
            />
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Positioned notifications with progress indicators and clean styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Inverted Toasts (Colored Backgrounds)</h4>
              <div className="flex flex-wrap gap-2">
                <ButtonPremium 
                  variant="default"
                  size="sm"
                  onClick={() => showExampleToast('default')}
                >
                  Default
                </ButtonPremium>
                <ButtonPremium 
                  variant="primary"
                  size="sm"
                  onClick={() => showExampleToast('primary')}
                >
                  Primary
                </ButtonPremium>
                <ButtonPremium 
                  variant="success"
                  size="sm"
                  onClick={() => showExampleToast('success')}
                >
                  Success
                </ButtonPremium>
                <ButtonPremium 
                  variant="warning"
                  size="sm"
                  onClick={() => showExampleToast('warning')}
                >
                  Warning
                </ButtonPremium>
                <ButtonPremium 
                  variant="error"
                  size="sm"
                  onClick={() => showExampleToast('error')}
                >
                  Error
                </ButtonPremium>
                <ButtonPremium 
                  variant="info"
                  size="sm"
                  onClick={() => showExampleToast('info')}
                >
                  Info
                </ButtonPremium>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Light Variants (Subtle)</h4>
              <div className="flex flex-wrap gap-2">
                <ButtonPremium 
                  variant="outline"
                  size="sm"
                  onClick={() => showExampleToast('light-primary')}
                >
                  Light Primary
                </ButtonPremium>
                <ButtonPremium 
                  variant="outline"
                  size="sm"
                  onClick={() => showExampleToast('light-success')}
                >
                  Light Success
                </ButtonPremium>
                <ButtonPremium 
                  variant="outline"
                  size="sm"
                  onClick={() => showExampleToast('light-warning')}
                >
                  Light Warning
                </ButtonPremium>
                <ButtonPremium 
                  variant="outline"
                  size="sm"
                  onClick={() => showExampleToast('light-error')}
                >
                  Light Error
                </ButtonPremium>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Indicators</CardTitle>
          <CardDescription>
            Clean progress bars with segmented options and smooth animations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <ProgressBar 
              value={progress} 
              variant="default"
              label="File Upload"
              showValue
            />

            <ProgressBar 
              value={85} 
              variant="primary"
              label="Profile Completion"
              showValue
            />

            <ProgressBar 
              value={92} 
              variant="success"
              label="Setup Progress"
              showValue
            />

            <ProgressBar 
              value={45} 
              variant="warning"
              label="Storage Usage"
              showValue
              size="lg"
            />

            <ProgressBar 
              value={25} 
              variant="error"
              label="Sync Status"
              showValue
            />

            <ProgressBar 
              indeterminate
              variant="primary"
              label="Processing..."
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Segmented Progress</h4>
            <SegmentedProgressBar
              segments={[
                { value: 35, color: "#0094CA", label: "Completed Repairs" },
                { value: 20, color: "#F59E0B", label: "In Progress" },
                { value: 15, color: "#10B981", label: "Quality Check" },
                { value: 8, color: "#EF4444", label: "On Hold" },
              ]}
              max={100}
              label="Repair Status Overview"
              showValue
              showLabels
            />
          </div>

          <div className="flex gap-2">
            <ButtonPremium 
              size="sm"
              variant="outline"
              onClick={() => setProgress(Math.max(0, progress - 10))}
            >
              Decrease
            </ButtonPremium>
            <ButtonPremium 
              size="sm"
              variant="outline"
              onClick={() => setProgress(Math.min(100, progress + 10))}
            >
              Increase
            </ButtonPremium>
          </div>
        </CardContent>
      </Card>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
          <CardDescription>
            Multiple loading animation styles with consistent branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner variant="spin" size="lg" color="primary" />
                <span className="text-xs text-muted-foreground">Spin</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner variant="dots" size="lg" color="primary" />
                <span className="text-xs text-muted-foreground">Dots</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner variant="pulse" size="lg" color="primary" />
                <span className="text-xs text-muted-foreground">Pulse</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner variant="bars" size="lg" color="primary" />
                <span className="text-xs text-muted-foreground">Bars</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner variant="ring" size="lg" color="primary" />
                <span className="text-xs text-muted-foreground">Ring</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">With Labels & Colors</h4>
              <div className="flex flex-wrap gap-6">
                <LoadingSpinner variant="spin" label="Saving..." color="primary" />
                <LoadingSpinner variant="dots" label="Processing..." color="success" />
                <LoadingSpinner variant="pulse" label="Loading..." color="warning" />
                <LoadingSpinner variant="ring" label="Syncing..." color="info" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Inline Loading</h4>
              <div className="space-y-3">
                <LoadingInline isLoading={loading}>
                  Submitting repair ticket...
                </LoadingInline>
                <LoadingInline isLoading={false}>
                  Form validation complete
                </LoadingInline>
                <ButtonPremium 
                  variant="outline" 
                  size="sm" 
                  onClick={simulateLoading}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Simulate Loading"}
                </ButtonPremium>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loaders */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loaders</CardTitle>
          <CardDescription>
            Content placeholders with smooth animations and preset layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-3">Card Skeleton</h4>
              <SkeletonCard animated lines={3} showAvatar />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">List Skeleton</h4>
              <SkeletonList animated items={3} showAvatar />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Table Skeleton</h4>
            <SkeletonTable rows={4} columns={5} showHeader />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-3">Form Skeleton</h4>
              <SkeletonForm fields={4} />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Custom Layout</h4>
              <div className="space-y-3">
                <SkeletonPremium variant="title" className="w-2/3" />
                <div className="space-y-2">
                  <SkeletonPremium variant="text" className="w-full" />
                  <SkeletonPremium variant="text" className="w-5/6" />
                  <SkeletonPremium variant="text" className="w-4/6" />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <SkeletonPremium variant="avatar" />
                  <div className="flex-1 space-y-2">
                    <SkeletonPremium variant="text" className="w-1/3" />
                    <SkeletonPremium variant="text" className="w-1/2" />
                  </div>
                  <SkeletonPremium variant="button" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}