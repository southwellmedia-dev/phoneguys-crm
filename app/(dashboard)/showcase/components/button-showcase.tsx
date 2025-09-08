"use client";

import { useState } from "react";
import { ButtonPremium } from "@/components/premium/ui/buttons/button-premium";
import { ButtonGroup } from "@/components/premium/ui/buttons/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Download, 
  Upload, 
  ChevronRight, 
  Check,
  X,
  AlertCircle,
  Info
} from "lucide-react";

export function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            All available button styles and variants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ButtonPremium variant="default">Default</ButtonPremium>
            <ButtonPremium variant="gradient">Gradient</ButtonPremium>
            <ButtonPremium variant="glass">Glass</ButtonPremium>
            <ButtonPremium variant="glow">Glow</ButtonPremium>
            <ButtonPremium variant="soft">Soft</ButtonPremium>
            <ButtonPremium variant="success">Success</ButtonPremium>
            <ButtonPremium variant="warning">Warning</ButtonPremium>
            <ButtonPremium variant="error">Error</ButtonPremium>
            <ButtonPremium variant="info">Info</ButtonPremium>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
          <CardDescription>
            Size variations for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <ButtonPremium size="xs" variant="gradient">Extra Small</ButtonPremium>
            <ButtonPremium size="sm" variant="gradient">Small</ButtonPremium>
            <ButtonPremium size="md" variant="gradient">Medium</ButtonPremium>
            <ButtonPremium size="lg" variant="gradient">Large</ButtonPremium>
            <ButtonPremium size="xl" variant="gradient">Extra Large</ButtonPremium>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button States</CardTitle>
          <CardDescription>
            Loading, disabled, and icon variations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ButtonPremium 
              variant="gradient" 
              loading={loading}
              onClick={handleLoadingClick}
            >
              {loading ? "Loading..." : "Click to Load"}
            </ButtonPremium>
            <ButtonPremium variant="default" disabled>
              Disabled
            </ButtonPremium>
            <ButtonPremium variant="success" leftIcon={<Check />}>
              With Left Icon
            </ButtonPremium>
            <ButtonPremium variant="error" rightIcon={<ChevronRight />}>
              With Right Icon
            </ButtonPremium>
            <ButtonPremium variant="info" leftIcon={<Info />} rightIcon={<ChevronRight />}>
              Both Icons
            </ButtonPremium>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Groups</CardTitle>
          <CardDescription>
            Group related actions together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Attached Group</p>
              <ButtonGroup attached>
                <ButtonPremium variant="default" leftIcon={<Plus />}>Create</ButtonPremium>
                <ButtonPremium variant="default" leftIcon={<Upload />}>Upload</ButtonPremium>
                <ButtonPremium variant="default" leftIcon={<Download />}>Download</ButtonPremium>
              </ButtonGroup>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Detached Group</p>
              <ButtonGroup>
                <ButtonPremium variant="success" leftIcon={<Check />}>Approve</ButtonPremium>
                <ButtonPremium variant="warning" leftIcon={<AlertCircle />}>Review</ButtonPremium>
                <ButtonPremium variant="error" leftIcon={<X />}>Reject</ButtonPremium>
              </ButtonGroup>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Mixed Variants</p>
              <ButtonGroup>
                <ButtonPremium variant="gradient">Primary Action</ButtonPremium>
                <ButtonPremium variant="soft">Secondary</ButtonPremium>
                <ButtonPremium variant="glass">Tertiary</ButtonPremium>
              </ButtonGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Width Buttons</CardTitle>
          <CardDescription>
            Buttons that span the full container width
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ButtonPremium variant="gradient" fullWidth leftIcon={<Plus />}>
            Create New Order
          </ButtonPremium>
          <ButtonPremium variant="soft" fullWidth>
            View All Orders
          </ButtonPremium>
          <ButtonPremium variant="glass" fullWidth>
            Export Data
          </ButtonPremium>
        </CardContent>
      </Card>
    </div>
  );
}