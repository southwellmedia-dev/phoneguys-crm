"use client";

import { PageHeader } from "./page-header";
import { useHeader } from "@/lib/contexts/header-context";

export function HeaderWrapper() {
  const { config } = useHeader();
  
  return (
    <PageHeader 
      title={config.title}
      description={config.description}
      actions={config.actions}
    />
  );
}