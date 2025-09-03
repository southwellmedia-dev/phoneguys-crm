"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { HeaderAction } from "@/components/layout/page-header";

interface HeaderConfig {
  title?: string;
  description?: string;
  actions?: HeaderAction[];
}

interface HeaderContextType {
  config: HeaderConfig;
  setHeader: (config: HeaderConfig) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({
    title: "The Phone Guys CRM",
  });

  return (
    <HeaderContext.Provider value={{ config, setHeader: setConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within HeaderProvider");
  }
  return context;
}