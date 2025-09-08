"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { TabNav } from "@/components/premium/ui/navigation/tab-nav";
import { ButtonShowcase } from "./components/button-showcase";
import { CardShowcase } from "./components/card-showcase";
import { BadgeShowcase } from "./components/badge-showcase";
import { FeedbackShowcase } from "./components/feedback-showcase";
import { TableShowcase } from "./components/table-showcase";
import { NavigationShowcase } from "./components/navigation-showcase";
import { OverviewShowcase } from "./components/overview-showcase";
import { 
  Layout, 
  Square, 
  Badge, 
  MessageSquare,
  Table, 
  Navigation,
  Layers
} from "lucide-react";

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Layout className="h-4 w-4" /> },
    { id: "buttons", label: "Buttons", icon: <Square className="h-4 w-4" />, count: 2 },
    { id: "cards", label: "Cards", icon: <Layers className="h-4 w-4" />, count: 4 },
    { id: "badges", label: "Badges", icon: <Badge className="h-4 w-4" />, count: 1 },
    { id: "feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" />, count: 5 },
    { id: "tables", label: "Tables", icon: <Table className="h-4 w-4" />, count: 1 },
    { id: "navigation", label: "Navigation", icon: <Navigation className="h-4 w-4" />, count: 2 },
  ];

  return (
    <PageContainer
      title="Premium Component Showcase"
      description="Interactive preview of all premium components in the library"
    >
      <div className="space-y-6">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="contrast"
        />

        <div className="min-h-[600px]">
          {activeTab === "overview" && <OverviewShowcase />}
          {activeTab === "buttons" && <ButtonShowcase />}
          {activeTab === "cards" && <CardShowcase />}
          {activeTab === "badges" && <BadgeShowcase />}
          {activeTab === "feedback" && <FeedbackShowcase />}
          {activeTab === "tables" && <TableShowcase />}
          {activeTab === "navigation" && <NavigationShowcase />}
        </div>
      </div>
    </PageContainer>
  );
}