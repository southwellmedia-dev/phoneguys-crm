"use client";

import { HeaderEnhanced } from "./header-enhanced";
import { useHeader } from "@/lib/contexts/header-context";

export function HeaderWrapperPremium() {
  const { config } = useHeader();
  
  return (
    <HeaderEnhanced 
      title={config.title}
      description={config.description}
      actions={config.actions}
    />
  );
}